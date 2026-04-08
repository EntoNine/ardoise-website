// ─── app.js ────────────────────────────────────────────────────────────────────
// Hash router + Alpine.data components
// Loaded last (after utils.js, store.js, pdf.js)
// ──────────────────────────────────────────────────────────────────────────────

// ─── Hash router ─────────────────────────────────────────────────────────────

const Router = {
  current: '',
  params: {},

  init() {
    window.addEventListener('hashchange', () => this._parse())
    this._parse()
  },

  _parse() {
    const hash = location.hash.replace(/^#\/?/, '') || 'documents'
    // Match: document/new or document/:id
    if (hash.startsWith('document/')) {
      const seg = hash.slice(9)
      if (seg === 'new') { this.current = 'document-form'; this.params = { id: null } }
      else               { this.current = 'document-form'; this.params = { id: seg } }
    } else {
      this.current = hash.split('/')[0]
      this.params = {}
    }
    document.querySelectorAll('[data-section]').forEach(el => {
      el.style.display = (el.dataset.section === this.current) ? '' : 'none'
    })
    document.querySelectorAll('[data-nav]').forEach(el => {
      el.classList.toggle('active', el.dataset.nav === this.current)
    })
    // Trigger section init event
    document.dispatchEvent(new CustomEvent('route-changed', { detail: { route: this.current, params: this.params } }))
  },

  go(path) { location.hash = '/' + path },
}

// ─── Toast helper ─────────────────────────────────────────────────────────────

const Toasts = {
  list: [],
  show(msg, type = 'info', duration = 3000) {
    const t = { id: Date.now(), msg, type }
    this.list.push(t)
    setTimeout(() => { this.list = this.list.filter(x => x.id !== t.id) }, duration)
  }
}

// ─── ColorPicker Alpine.data component ───────────────────────────────────────

function colorPicker(initialColor, onChangeCallback) {
  return {
    value: initialColor || '#000000',
    open: false,
    hue: 0, sat: 1, val: 1,
    _dragging: null,
    _listeners: null,

    swatches: [
      '#111827','#374151','#6b7280','#9ca3af',
      '#1e3a5f','#1e40af','#2563eb','#3b82f6',
      '#7c3aed','#8b5cf6','#a78bfa','#c084fc',
      '#059669','#10b981','#34d399','#6ee7b7',
      '#dc2626','#ef4444','#f87171','#fca5a5',
      '#d97706','#f59e0b','#fbbf24','#fcd34d',
      '#ec4899','#f472b6','#fb7185','#fda4af',
      '#0d9488','#14b8a6','#2dd4bf','#5eead4',
    ],

    init() { this._syncFromHex(this.value) },

    get popoverStyle() {
      const trigger = this.$refs.trigger
      if (!trigger) return ''
      const r = trigger.getBoundingClientRect()
      const top = r.bottom + 6
      const left = Math.max(8, Math.min(r.left, window.innerWidth - 260))
      const showAbove = top + 360 > window.innerHeight
      return `position:fixed;left:${left}px;top:${showAbove ? r.top - 360 - 6 : top}px;z-index:9999`
    },

    toggle() {
      this.open = !this.open
      if (this.open) this._bind()
      else this._unbind()
    },

    close() { this.open = false; this._unbind() },

    _bind() {
      const outsideClick = (e) => {
        if (!this.$el.contains(e.target)) this.close()
      }
      const move = (e) => {
        if (this._dragging === 'sat' && this.$refs.sat) {
          const r = this.$refs.sat.getBoundingClientRect()
          this.sat = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width))
          this.val = Math.max(0, Math.min(1, 1 - (e.clientY - r.top) / r.height))
          this._emit()
        } else if (this._dragging === 'hue' && this.$refs.hue) {
          const r = this.$refs.hue.getBoundingClientRect()
          this.hue = Math.max(0, Math.min(360, (e.clientX - r.left) / r.width * 360))
          this._emit()
        }
      }
      const up = () => { this._dragging = null }
      this._listeners = { outsideClick, move, up }
      document.addEventListener('mousedown', outsideClick)
      window.addEventListener('pointermove', move)
      window.addEventListener('pointerup', up)
    },

    _unbind() {
      if (!this._listeners) return
      document.removeEventListener('mousedown', this._listeners.outsideClick)
      window.removeEventListener('pointermove', this._listeners.move)
      window.removeEventListener('pointerup', this._listeners.up)
      this._listeners = null
    },

    startDragSat(e) { this._dragging = 'sat'; this._updateSat(e) },
    startDragHue(e) { this._dragging = 'hue'; this._updateHue(e) },

    _updateSat(e) {
      if (!this.$refs.sat) return
      const r = this.$refs.sat.getBoundingClientRect()
      this.sat = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width))
      this.val = Math.max(0, Math.min(1, 1 - (e.clientY - r.top) / r.height))
      this._emit()
    },
    _updateHue(e) {
      if (!this.$refs.hue) return
      const r = this.$refs.hue.getBoundingClientRect()
      this.hue = Math.max(0, Math.min(360, (e.clientX - r.left) / r.width * 360))
      this._emit()
    },

    selectColor(c) { this.value = c; this._syncFromHex(c); this._emitValue(); this.close() },

    onHexInput(e) {
      let v = e.target.value.trim()
      if (!v.startsWith('#')) v = '#' + v
      if (/^#[0-9a-fA-F]{6}$/.test(v)) {
        this.value = v.toLowerCase(); this._syncFromHex(v); this._emitValue()
      }
    },

    _emit() { this.value = this._hsvToHex(this.hue, this.sat, this.val); this._emitValue() },
    _emitValue() { if (onChangeCallback) onChangeCallback(this.value) },

    _syncFromHex(hex) {
      if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return
      const [h, s, v] = this._hexToHsv(hex)
      this.hue = h; this.sat = s; this.val = v
    },

    _hexToHsv(hex) {
      const r = parseInt(hex.slice(1,3),16)/255, g = parseInt(hex.slice(3,5),16)/255, b = parseInt(hex.slice(5,7),16)/255
      const max = Math.max(r,g,b), min = Math.min(r,g,b), d = max-min
      let h = 0
      if (d>0) {
        if (max===r) h=((g-b)/d+6)%6
        else if(max===g) h=(b-r)/d+2
        else h=(r-g)/d+4
        h*=60
      }
      return [h, max===0?0:d/max, max]
    },

    _hsvToHex(h, s, v) {
      const c=v*s, x=c*(1-Math.abs(((h/60)%2)-1)), m=v-c
      let r=0,g=0,b=0
      if(h<60){r=c;g=x} else if(h<120){r=x;g=c} else if(h<180){g=c;b=x}
      else if(h<240){g=x;b=c} else if(h<300){r=x;b=c} else{r=c;b=x}
      const hex=(n)=>Math.round((n+m)*255).toString(16).padStart(2,'0')
      return `#${hex(r)}${hex(g)}${hex(b)}`
    },

    get hueBg() { return `hsl(${this.hue}, 100%, 50%)` },
    get satLeft() { return this.sat * 100 + '%' },
    get satTop()  { return (1 - this.val) * 100 + '%' },
    get hueLeft() { return this.hue / 360 * 100 + '%' },
  }
}

// ─── Logo manager ─────────────────────────────────────────────────────────────

function logoManager(brandingRef) {
  return {
    dragOver: false,

    handleDrop(e) {
      e.preventDefault(); this.dragOver = false
      const file = (e.dataTransfer || e.target).files?.[0]
      if (file) this._load(file)
    },

    handleFile(e) {
      const file = e.target.files?.[0]
      if (file) this._load(file)
    },

    _load(file) {
      if (!file.type.match(/^image\//)) { alert('Formats acceptés : PNG, JPG, SVG'); return }
      if (file.size > 2 * 1024 * 1024)  { alert('Fichier trop grand (max 2 Mo)'); return }
      const reader = new FileReader()
      reader.onload = (e) => {
        brandingRef.logoUrl = e.target.result
        Alpine.store('theme').persist()
      }
      reader.readAsDataURL(file)
    },

    removeLogo() {
      brandingRef.logoUrl = null
      Alpine.store('theme').persist()
    },

    setPosition(pos) {
      brandingRef.logoPosition = pos
      Alpine.store('theme').persist()
    },
  }
}

// ─── Invoice preview helpers (shared between designer & form) ─────────────────

function computePages(lignes, theme) {
  const { padding, gridGap } = theme.layout
  const { baseSize, lineHeight } = theme.typography
  const bodyH = 297 - 2 * padding
  const rowH  = baseSize * lineHeight * 0.35 + 4
  const all   = lignes.filter(l => !l._isSection)

  if (!all.length) return [lignes]

  const pages = []
  let idx = 0
  const p1 = Math.max(1, Math.floor((bodyH - 55 - 10 - 8) / rowH))
  pages.push(lignes.slice(0, p1)); idx = p1
  while (idx < lignes.length) {
    const avail = bodyH - 15 - 10 - 8
    const rem   = lignes.length - idx
    const last  = Math.floor((avail - 55) / rowH)
    if (rem <= last) { pages.push(lignes.slice(idx)); idx = lignes.length }
    else { const n = Math.max(1, Math.floor(avail / rowH)); pages.push(lignes.slice(idx, idx+n)); idx+=n }
  }
  return pages
}

function computeTotaux(lignes, remisePct, regime) {
  const { calculerTotaux } = window.AWUtils
  const lines = lignes.filter(l => !l._isSection)
  return calculerTotaux(lines, remisePct, regime?.taux_tps||0, regime?.taux_tvq||0, regime?.taux_tva||0)
}

function fmtM(val, devise) { return window.AWUtils.formaterMontant(val, devise || 'CAD') }
function ligneTotal(l) {
  const base = l.quantite * l.prix_unitaire
  return l.remise_pct ? base * (1 - l.remise_pct / 100) : base
}

// ─── Section: Documents list ──────────────────────────────────────────────────

document.addEventListener('alpine:init', () => {

  Alpine.data('docsList', () => ({
    filter: 'all',
    get docs() {
      const list = Alpine.store('docs').list
      if (this.filter === 'all') return list
      return list.filter(d => d.type === this.filter)
    },
    get devise() { return Alpine.store('settings').devise },

    totauxFor(doc) {
      const regime = Alpine.store('settings').regime
      return computeTotaux(doc.lignes, doc.remise_pct, regime)
    },
    fmtM,

    createDoc(type) { const id = Alpine.store('docs').create(type); Router.go('document/' + id) },
    editDoc(id)    { Router.go('document/' + id) },
    deleteDoc(id)  { if (confirm('Supprimer ce document ?')) Alpine.store('docs').delete(id) },
    dupDoc(id)     { const newId = Alpine.store('docs').duplicate(id); Router.go('document/' + newId) },

    async previewDoc(id) {
      const doc = Alpine.store('docs').getById(id)
      if (!doc) return
      const ent = Alpine.store('settings').entreprise
      const regime = Alpine.store('settings').regime
      const entFull = { ...ent, taux_tps: regime?.taux_tps||0, taux_tvq: regime?.taux_tvq||0, taux_tva: regime?.taux_tva||0 }
      const data = await window.AWPdf.genererPdfThemed({
        type: doc.type, numero: doc.numero, date_creation: doc.date_creation,
        date_validite: doc.date_validite, date_echeance: doc.date_echeance,
        objet: doc.objet, notes: doc.notes, conditions: doc.conditions,
        remise_pct: doc.remise_pct, entreprise: entFull, client: doc.client,
        lignes: doc.lignes.filter(l => !l._isSection),
        theme: Alpine.store('theme').data, lang: Alpine.store('settings').lang,
      })
      if (window._docListPdfUrl) { URL.revokeObjectURL(window._docListPdfUrl) }
      const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }))
      window._docListPdfUrl = url
      const modal = document.getElementById('pdf-modal')
      const iframe = modal.querySelector('iframe')
      // Set src BEFORE showing so iframe starts loading while parent is still hidden
      iframe.src = 'about:blank'
      await new Promise(r => requestAnimationFrame(r))
      iframe.src = url
      await new Promise(r => requestAnimationFrame(r))
      modal.style.display = ''
    },

    async downloadDoc(id) {
      const doc = Alpine.store('docs').getById(id)
      if (!doc) return
      const ent = Alpine.store('settings').entreprise
      const regime = Alpine.store('settings').regime
      const entFull = { ...ent, taux_tps: regime?.taux_tps||0, taux_tvq: regime?.taux_tvq||0, taux_tva: regime?.taux_tva||0 }
      const data = await window.AWPdf.genererPdfThemed({
        type: doc.type, numero: doc.numero, date_creation: doc.date_creation,
        date_validite: doc.date_validite, date_echeance: doc.date_echeance,
        objet: doc.objet, notes: doc.notes, conditions: doc.conditions,
        remise_pct: doc.remise_pct, entreprise: entFull, client: doc.client,
        lignes: doc.lignes.filter(l => !l._isSection),
        theme: Alpine.store('theme').data, lang: Alpine.store('settings').lang,
      })
      await window.AWPdf.telechargerPdf(data, doc.numero + '.pdf')
    },

    statusLabel(doc) {
      const t = Alpine.store('i18n').t.bind(Alpine.store('i18n'))
      const map = {
        brouillon: t('statutBrouillon'), envoye: t('statutEnvoye'),
        accepte: t('statutAccepte'), refuse: t('statutRefuse'),
        non_payee: t('statutNonPayee'), payee: t('statutPayee'), en_retard: t('statutEnRetard'),
      }
      return map[doc.statut] || doc.statut
    },
    statusClass(doc) {
      const map = {
        brouillon:'badge-brouillon', envoye:'badge-envoye', accepte:'badge-accepte', refuse:'badge-refuse',
        non_payee:'badge-non-payee', payee:'badge-paye', en_retard:'badge-en-retard',
      }
      return map[doc.statut] || 'badge-brouillon'
    },
    formatDate(d) { return d ? String(d).split('T')[0] : '—' },
  }))

  // ─── Section: Document form ──────────────────────────────────────────────

  Alpine.data('docForm', () => {
    let _pdfDoc = null   // closure — NOT proxied by Alpine, so PDF.js private fields (#d) work correctly

    return {
    doc: null,
    saving: false,
    pdfLoading: false,
    pdfUrl: null,
    showPdfModal: false,
    pdfZoom: 100,      // percent — 100 = fit-to-container width
    newPresetName: '',

    get theme()   { return Alpine.store('theme').data },
    get regime()  { return Alpine.store('settings').regime },
    get devise()  { return Alpine.store('settings').devise },
    get lang()    { return Alpine.store('settings').lang },
    get isFr()    { return this.lang === 'fr' },

    get units() {
      const fr = this.lang === 'fr'
      return [
        { value:'h',       label: fr ? 'h — heure'    : 'h — hour'      },
        { value:'j',       label: fr ? 'j — jour'     : 'd — day'       },
        { value:'sem',     label: fr ? 'sem — semaine': 'wk — week'     },
        { value:'mois',    label: fr ? 'mois'         : 'mo — month'    },
        { value:'an',      label: fr ? 'an — année'   : 'yr — year'     },
        { value:'u',       label: fr ? 'u — unité'    : 'u — unit'      },
        { value:'pcs',     label: fr ? 'pcs — pièces' : 'pcs — pieces'  },
        { value:'forfait', label: fr ? 'forfait'       : 'flat rate'     },
        { value:'lot',     label: 'lot'                                  },
        { value:'m',       label: 'm'                                    },
        { value:'m²',      label: 'm²'                                   },
        { value:'km',      label: 'km'                                   },
        { value:'kg',      label: 'kg'                                   },
        { value:'L',       label: 'L'                                    },
      ]
    },

    get pages() {
      if (!this.doc) return [[]]
      return computePages(this.doc.lignes, this.theme)
    },

    get totaux() {
      if (!this.doc) return { sous_total:0, remise:0, ht:0, tps:0, tvq:0, tva:0, ttc:0 }
      return computeTotaux(this.doc.lignes, this.doc.remise_pct, this.regime)
    },

    get tvaLabel() {
      const r = this.regime
      if (!r) return '0%'
      if (r.taux_tva > 0) return (r.taux_tva * 100).toFixed(1) + '%'
      if (r.taux_tps > 0) return (r.taux_tps * 100).toFixed(1) + '%'
      return '0%'
    },

    get entreprise() {
      const s = Alpine.store('settings')
      const r = s.regime
      return { ...s.entreprise, taux_tps: r?.taux_tps||0, taux_tvq: r?.taux_tvq||0, taux_tva: r?.taux_tva||0 }
    },

    get clientAdresse() {
      if (!this.doc?.client) return ''
      const c = this.doc.client
      return [c.adresse, [c.ville, c.code_postal].filter(Boolean).join(' '), c.pays].filter(Boolean).join(', ')
    },

    get pageVars() {
      const t = this.theme
      const customFont = t.typography.customFont?.trim()
      const fontStack  = customFont ? `"${customFont}", ${t.typography.primaryFont}, Helvetica, sans-serif`
                                    : `${t.typography.primaryFont}, Helvetica, sans-serif`
      const hex2rgba = (h, a) => { const r=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h); return r?`rgba(${parseInt(r[1],16)},${parseInt(r[2],16)},${parseInt(r[3],16)},${a})`:`rgba(30,58,95,${a})` }
      return {
        '--inv-primary':      t.colors.primary,
        '--inv-secondary':    t.colors.secondary,
        '--inv-text':         t.colors.text,
        '--inv-accent':       t.colors.accent,
        '--inv-row-bg':       t.colors.tableRowBg,
        '--inv-client-bg':    hex2rgba(t.colors.primary, 0.07),
        '--inv-font-primary': fontStack,
        '--inv-font-secondary': t.typography.secondaryFont + ', Helvetica, sans-serif',
        '--inv-font-size':    t.typography.baseSize + 'px',
        '--inv-line-height':  String(t.typography.lineHeight),
        '--inv-padding':      t.layout.padding + 'mm',
        '--inv-gap':          t.layout.gridGap + 'px',
      }
    },

    init() {
      document.addEventListener('route-changed', (e) => {
        if (e.detail.route === 'document-form') this._load(e.detail.params.id)
      })
      if (Router.current === 'document-form') this._load(Router.params.id)
    },

    _load(id) {
      if (!id) {
        this.doc = {
          id: window.AWUtils.generateId(),
          type: 'devis',
          numero: window.AWUtils.generateDocNumber('devis'),
          statut: 'brouillon',
          date_creation: window.AWUtils.todayISO(),
          date_validite: window.AWUtils.addDays(window.AWUtils.todayISO(), 30),
          date_echeance: null,
          objet: '', notes: '', conditions: '', remise_pct: 0,
          client: { nom:'', entreprise:'', adresse:'', ville:'', code_postal:'', pays:'', email:'' },
          lignes: [],
        }
      } else {
        const found = Alpine.store('docs').getById(id)
        this.doc = found ? JSON.parse(JSON.stringify(found)) : null
      }
      this.pdfUrl = null
    },

    switchType(type) {
      if (!this.doc || this.doc.type === type) return
      this.doc.type = type
      this.doc.numero = window.AWUtils.generateDocNumber(type)
      this.doc.statut = type === 'devis' ? 'brouillon' : 'non_payee'
      if (type === 'devis') { this.doc.date_validite = window.AWUtils.addDays(window.AWUtils.todayISO(), 30); this.doc.date_echeance = null }
      else { this.doc.date_echeance = window.AWUtils.addDays(window.AWUtils.todayISO(), 30); this.doc.date_validite = null }
    },

    save() {
      if (!this.doc) return
      Alpine.store('docs').save(this.doc)
      Toasts.show('Document sauvegardé', 'success')
    },

    saveAndBack() { this.save(); Router.go('documents') },

    addLigne()   { this.doc.lignes.push(window.newLigne()) },
    addSection() { this.doc.lignes.push(window.newSection()) },

    dupLigne(idx) {
      const copy = JSON.parse(JSON.stringify(this.doc.lignes[idx]))
      copy.id = window.AWUtils.generateId()
      this.doc.lignes.splice(idx + 1, 0, copy)
    },

    removeLigne(idx) { this.doc.lignes.splice(idx, 1) },

    ligneTotal,

    fmt(val) { return fmtM(val, this.devise) },

    statusOptions() {
      if (!this.doc) return []
      const t = Alpine.store('i18n').t.bind(Alpine.store('i18n'))
      return this.doc.type === 'devis'
        ? [{v:'brouillon',l:t('statutBrouillon')},{v:'envoye',l:t('statutEnvoye')},{v:'accepte',l:t('statutAccepte')},{v:'refuse',l:t('statutRefuse')}]
        : [{v:'non_payee',l:t('statutNonPayee')},{v:'payee',l:t('statutPayee')},{v:'en_retard',l:t('statutEnRetard')}]
    },

    async previewPdf() {
      if (!this.doc) return
      this.pdfLoading = true
      try {
        const data = await window.AWPdf.genererPdfThemed({
          type: this.doc.type, numero: this.doc.numero, date_creation: this.doc.date_creation,
          date_validite: this.doc.date_validite, date_echeance: this.doc.date_echeance,
          objet: this.doc.objet, notes: this.doc.notes, conditions: this.doc.conditions,
          remise_pct: this.doc.remise_pct, entreprise: this.entreprise, client: this.doc.client,
          lignes: this.doc.lignes.filter(l => !l._isSection),
          theme: this.theme, lang: this.lang,
        })
        if (this._pdfBlobUrl) { URL.revokeObjectURL(this._pdfBlobUrl); this._pdfBlobUrl = null }
        const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }))
        this._pdfBlobUrl = url
        // Show overlay
        const overlay = document.getElementById('pdf-preview-overlay')
        if (overlay) overlay.style.display = ''
        // Load PDF doc and render all pages
        _pdfDoc = await window.pdfjsLib.getDocument({ url }).promise
        this.pdfZoom = 100
        await this._renderPdfPages()
      } finally { this.pdfLoading = false }
    },

    // Render (or re-render) all pages at current pdfZoom level
    async _renderPdfPages() {
      if (!_pdfDoc) return
      const container = document.getElementById('pdf-pages-container')
      if (!container) return
      container.innerHTML = '<div style="color:#fff;padding:24px;font-size:14px">Chargement…</div>'
      const containerWidth = container.clientWidth - 40
      container.innerHTML = ''
      for (let i = 1; i <= _pdfDoc.numPages; i++) {
        const page = await _pdfDoc.getPage(i)
        const naturalWidth = page.getViewport({ scale: 1 }).width
        // base scale fits page to container; pdfZoom% is applied on top
        const baseScale = Math.max(0.5, containerWidth / naturalWidth)
        const scale = baseScale * (this.pdfZoom / 100)
        const viewport = page.getViewport({ scale })
        const canvas = document.createElement('canvas')
        canvas.width = viewport.width
        canvas.height = viewport.height
        container.appendChild(canvas)
        await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise
      }
    },

    async changePdfZoom(delta) {
      this.pdfZoom = Math.min(300, Math.max(25, this.pdfZoom + delta))
      await this._renderPdfPages()
    },

    async resetPdfZoom() {
      this.pdfZoom = 100
      await this._renderPdfPages()
    },

    async downloadPdf() {
      if (!this.doc) return
      this.pdfLoading = true
      try {
        const data = await window.AWPdf.genererPdfThemed({
          type: this.doc.type, numero: this.doc.numero, date_creation: this.doc.date_creation,
          date_validite: this.doc.date_validite, date_echeance: this.doc.date_echeance,
          objet: this.doc.objet, notes: this.doc.notes, conditions: this.doc.conditions,
          remise_pct: this.doc.remise_pct, entreprise: this.entreprise, client: this.doc.client,
          lignes: this.doc.lignes.filter(l => !l._isSection),
          theme: this.theme, lang: this.lang,
        })
        await window.AWPdf.telechargerPdf(data, (this.doc.numero || 'document') + '.pdf')
      } finally { this.pdfLoading = false }
    },

    closePdfModal() {
      const overlay = document.getElementById('pdf-preview-overlay')
      if (overlay) overlay.style.display = 'none'
      const container = document.getElementById('pdf-pages-container')
      if (container) container.innerHTML = ''
      if (this._pdfBlobUrl) { URL.revokeObjectURL(this._pdfBlobUrl); this._pdfBlobUrl = null }
      if (_pdfDoc) { _pdfDoc.destroy(); _pdfDoc = null }
      this.showPdfModal = false
    },

    formatDate(d) { return window.AWUtils.formatDate(d) },
  }  // end returned object
  }) // end docForm factory

  // ─── Section: Designer ────────────────────────────────────────────────────

  Alpine.data('designer', () => ({
    zoom: 80,
    docType: 'facture',
    newPresetName: '',
    importInput: null,

    get themeStore() { return Alpine.store('theme') },
    get theme()      { return Alpine.store('theme').data },
    get lang()       { return Alpine.store('settings').lang },
    get regime()     { return Alpine.store('settings').regime },

    get entreprise() {
      const s = Alpine.store('settings')
      const r = s.regime
      return { ...s.entreprise, taux_tps: r?.taux_tps||0, taux_tvq: r?.taux_tvq||0, taux_tva: r?.taux_tva||0 }
    },

    get pageVars() {
      const t = this.theme
      const customFont = t.typography.customFont?.trim()
      const fontStack  = customFont ? `"${customFont}", ${t.typography.primaryFont}, Helvetica, sans-serif`
                                    : `${t.typography.primaryFont}, Helvetica, sans-serif`
      const hex2rgba = (h, a) => { const r=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h); return r?`rgba(${parseInt(r[1],16)},${parseInt(r[2],16)},${parseInt(r[3],16)},${a})`:`rgba(30,58,95,${a})` }
      return {
        '--inv-primary':      t.colors.primary,
        '--inv-secondary':    t.colors.secondary,
        '--inv-text':         t.colors.text,
        '--inv-accent':       t.colors.accent,
        '--inv-row-bg':       t.colors.tableRowBg,
        '--inv-client-bg':    hex2rgba(t.colors.primary, 0.07),
        '--inv-font-primary': fontStack,
        '--inv-font-size':    t.typography.baseSize + 'px',
        '--inv-line-height':  String(t.typography.lineHeight),
        '--inv-padding':      t.layout.padding + 'mm',
        '--inv-gap':          t.layout.gridGap + 'px',
      }
    },

    get sampleClient() {
      const fr = this.lang === 'fr'
      return fr ? {
        nom: 'Client Exemple', entreprise: 'Entreprise ABC',
        adresse: '123 rue des Exemples', ville: 'Montréal', code_postal: 'H1A 0A1',
        pays: 'Canada', email: 'contact@entreprise-abc.com',
      } : {
        nom: 'Sample Client', entreprise: 'ABC Company',
        adresse: '123 Example Street', ville: 'Toronto', code_postal: 'M1A 0A1',
        pays: 'Canada', email: 'contact@abc-company.com',
      }
    },

    get sampleLignes() {
      const fr = this.lang === 'fr'
      return [
        { id:'1', description: fr?'Prestation forfaitaire — Lot A':'Fixed-price service — Package A',     quantite:1,  prix_unitaire:2500, unite:'forfait', remise_pct:0,  _isSection:false },
        { id:'2', description: fr?'Service journalier':'Daily service',                                   quantite:15, prix_unitaire:95,   unite:'h',       remise_pct:0,  _isSection:false },
        { id:'3', description: fr?'Développement & intégration':'Development & integration',              quantite:20, prix_unitaire:85,   unite:'h',       remise_pct:10, _isSection:false },
        { id:'4', description: fr?'Révisions & ajustements':'Revisions & adjustments',                   quantite:8,  prix_unitaire:85,   unite:'h',       remise_pct:0,  _isSection:false },
      ]
    },

    sampleNumero: 'DOC-2026-0001',
    sampleDate: '2026-03-30',
    sampleDateValidite: '2026-04-30',

    get sampleObjet() {
      return this.lang === 'fr' ? 'Projet type — Phase 1' : 'Sample project — Phase 1'
    },
    get sampleNotes() {
      return this.lang === 'fr'
        ? "Merci pour votre confiance. N'hésitez pas à nous contacter pour toute question."
        : 'Thank you for your trust. Feel free to contact us for any questions.'
    },
    get sampleConditions() {
      return this.lang === 'fr'
        ? 'Paiement à 30 jours. Pénalités de retard : 1,5 % par mois.'
        : 'Payment within 30 days. Late penalty: 1.5% per month.'
    },

    get colCount() {
      const c = this.theme.columns
      return 3 + (c.unite ? 1 : 0) + (c.remise ? 1 : 0) + (c.tva ? 1 : 0)
    },

    get sampleTotaux() { return computeTotaux(this.sampleLignes, 5, this.regime) },
    get samplePages()  { return computePages(this.sampleLignes, this.theme) },

    get tvaLabel() {
      const r = this.regime
      if (!r) return '0%'
      if (r.taux_tva > 0) return (r.taux_tva * 100).toFixed(1) + '%'
      if (r.taux_tps > 0) return (r.taux_tps * 100).toFixed(1) + '%'
      return '0%'
    },

    fmt(val) { return fmtM(val, Alpine.store('settings').devise) },
    ligneTotal,

    applyPreset(name)     { this.themeStore.applyPreset(name) },
    resetTheme()          { this.themeStore.reset() },
    savePreset()          { if (!this.newPresetName.trim()) return; this.themeStore.saveAsPreset(this.newPresetName); this.newPresetName = ''; Toasts.show('Design sauvegardé', 'success') },
    loadSaved(name)       { this.themeStore.loadSavedPreset(name) },
    deleteSaved(name)     { if (confirm('Supprimer "' + name + '" ?')) this.themeStore.deleteSavedPreset(name) },
    exportJson()          { this.themeStore.exportJson() },
    exportBundle()        { this.themeStore.exportBundle() },

    importJson() {
      const el = document.getElementById('import-json-input')
      if (el) el.click()
    },

    onImportFile(e) {
      const file = e.target.files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = (ev) => {
        const ok = this.themeStore.importJson(ev.target.result)
        Toasts.show(ok ? 'Design importé' : 'Fichier invalide', ok ? 'success' : 'error')
      }
      reader.readAsText(file)
      e.target.value = ''
    },

    async exportPdf() {
      const data = await window.AWPdf.genererPdfThemed({
        type: this.docType, numero: this.sampleNumero,
        date_creation: this.sampleDate, date_validite: this.sampleDateValidite, date_echeance: this.sampleDateValidite,
        objet: this.sampleObjet, notes: this.sampleNotes, conditions: this.sampleConditions,
        remise_pct: 5, entreprise: this.entreprise, client: this.sampleClient,
        lignes: this.sampleLignes, theme: this.theme, lang: this.lang,
      })
      await window.AWPdf.telechargerPdf(data, 'template-preview.pdf')
    },

    printPreview() { window.print() },

    // ColorPicker integration — store-backed
    colorPicker(key) {
      const self = this
      return colorPicker(self.theme.colors[key], (v) => {
        self.theme.colors[key] = v
        Alpine.store('theme').persist()
      })
    },

    // Logo manager — methods exposed directly on designer component
    dragOver: false,

    handleDrop(e) {
      e.preventDefault(); this.dragOver = false
      const file = e.dataTransfer?.files?.[0]
      if (file) this._loadLogo(file)
    },

    handleFile(e) {
      const file = e.target.files?.[0]
      if (file) this._loadLogo(file)
    },

    _loadLogo(file) {
      if (!file.type.match(/^image\//)) { alert('Formats acceptés : PNG, JPG, SVG, WebP'); return }
      if (file.size > 2 * 1024 * 1024)  { alert('Fichier trop grand (max 2 Mo)'); return }
      const reader = new FileReader()
      reader.onload = (ev) => {
        this.theme.branding.logoUrl = ev.target.result
        Alpine.store('theme').persist()
      }
      reader.readAsDataURL(file)
    },

    removeLogo() {
      this.theme.branding.logoUrl = null
      Alpine.store('theme').persist()
    },

    setPosition(pos) {
      this.theme.branding.logoPosition = pos
      Alpine.store('theme').persist()
    },
  }))

  // ─── Section: Settings ────────────────────────────────────────────────────

  Alpine.data('settings', () => ({
    get data()     { return Alpine.store('settings').data },
    get entreprise(){ return Alpine.store('settings').data.entreprise },
    get regimes()  { return window.AWUtils.getTaxRegimeGroups(Alpine.store('settings').lang) },
    get groups()   { return Object.keys(window.AWUtils.getTaxRegimeGroups(Alpine.store('settings').lang)) },

    save() { Alpine.store('settings').persist(); Toasts.show('Paramètres sauvegardés', 'success') },

    handleLogo(e) {
      const file = e.target.files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = (ev) => {
        this.data.entreprise.logo_base64 = ev.target.result
        // Sync to theme branding too
        Alpine.store('theme').data.branding.logoUrl = ev.target.result
        Alpine.store('theme').persist()
      }
      reader.readAsDataURL(file)
    },

    removeLogo() {
      this.data.entreprise.logo_base64 = null
      Alpine.store('theme').data.branding.logoUrl = null
      Alpine.store('theme').persist()
    },
  }))

  // ─── Toasts component ─────────────────────────────────────────────────────

  Alpine.data('toasts', () => ({
    get list() { return Toasts.list },
  }))

  // ─── Cookie consent ─────────────────────────────────────────────────────────
  Alpine.data('cookieConsent', () => ({
    showBanner: false,
    showManage: false,
    prefs: { ads: false },

    init() {
      const stored = (() => { try { return JSON.parse(localStorage.getItem('ardoise-cookie-consent') || 'null') } catch(e) { return null } })()
      if (stored === null) {
        // First visit — show banner
        document.getElementById('cookie-banner').style.display = ''
        this.showBanner = true
      } else {
        document.getElementById('cookie-banner').style.display = ''
        this.prefs = stored
        this._applyPrefs()
      }
      // Allow other components to open the manage modal via a custom event
      window.addEventListener('cookie-reopen', () => {
        document.getElementById('cookie-banner').style.display = ''
        this.showManage = true
      })
    },

    acceptAll() {
      this.prefs = { ads: true }
      this._save()
      this.showBanner = false
      this._applyPrefs()
    },

    rejectAll() {
      this.prefs = { ads: false }
      this._save()
      this.showBanner = false
      this._applyPrefs()
    },

    openManage() {
      this.showManage = true
    },

    savePrefs() {
      this._save()
      this.showBanner = false
      this.showManage = false
      this._applyPrefs()
    },

    _save() {
      try { localStorage.setItem('ardoise-cookie-consent', JSON.stringify(this.prefs)) } catch(e) {}
    },

    _applyPrefs() {
      // AdSense: only load if consented
      if (this.prefs.ads && !document.getElementById('adsense-script')) {
        const s = document.createElement('script')
        s.id = 'adsense-script'
        s.async = true
        s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9863175609905098'
        s.crossOrigin = 'anonymous'
        document.head.appendChild(s)
      }
    },
  }))
})

// ─── Sortable.js drag-to-reorder for lines table ─────────────────────────────

function initSortable(el, lignes) {
  if (!window.Sortable) return
  new Sortable(el, {
    handle: '.col-drag',
    animation: 150,
    ghostClass: 'sortable-ghost',
    onEnd(evt) {
      const moved = lignes.splice(evt.oldIndex, 1)[0]
      lignes.splice(evt.newIndex, 0, moved)
    },
  })
}

// ─── Bootstrap ────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  Router.init()

  // Init Sortable whenever the doc-form section is shown
  document.addEventListener('route-changed', (e) => {
    if (e.detail.route === 'document-form') {
      setTimeout(() => {
        const tbody = document.getElementById('lines-tbody')
        if (tbody) {
          // Sortable operates on DOM; Alpine keeps lignes array in sync via onEnd
          // We pass a proxy array reference — re-init on each navigation
          const formData = Alpine.$data(document.querySelector('[x-data="docForm"]'))
          if (formData && formData.doc) initSortable(tbody, formData.doc.lignes)
        }
      }, 100)
    }
  })
})

window.Router   = Router
window.Toasts   = Toasts
window.colorPicker = colorPicker
window.logoManager = logoManager
window.computePages = computePages
window.computeTotaux = computeTotaux
window.ligneTotal = ligneTotal
window.fmtM = fmtM
