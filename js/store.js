// ─── store.js ─────────────────────────────────────────────────────────────────
// Alpine.js global stores. Loaded after utils.js.
// Port of: devis-app/src/stores/invoiceTheme.ts + types/invoiceTheme.ts
// ──────────────────────────────────────────────────────────────────────────────
// Note: generateId, generateDocNumber, getTaxRegimeById, todayISO, etc. are
// available as globals defined by utils.js — no redeclaration needed.

// ─── Theme presets (port of types/invoiceTheme.ts PRESETS) ───────────────────

const THEME_PRESETS = {
  minimalist: {
    branding: { logoUrl: null, logoPosition: 'left', logoScale: 1 },
    typography: { primaryFont: 'Helvetica', secondaryFont: 'Helvetica', customFont: '', baseSize: 10, lineHeight: 1.5 },
    colors: { primary: '#374151', secondary: '#6b7280', text: '#111827', accent: '#374151', tableRowBg: '#f9fafb' },
    layout: { gridGap: 16, padding: 20, tableStyle: 'minimal', headerStyle: 'underline' },
    columns: { unite: false, tva: false, remise: false, reference: false },
  },
  corporate: {
    branding: { logoUrl: null, logoPosition: 'left', logoScale: 1 },
    typography: { primaryFont: 'Helvetica', secondaryFont: 'Helvetica', customFont: '', baseSize: 10, lineHeight: 1.4 },
    colors: { primary: '#1e3a5f', secondary: '#475569', text: '#0f172a', accent: '#1e40af', tableRowBg: '#f1f5f9' },
    layout: { gridGap: 12, padding: 18, tableStyle: 'bordered', headerStyle: 'filled' },
    columns: { unite: true, tva: true, remise: true, reference: true },
  },
  modern: {
    branding: { logoUrl: null, logoPosition: 'right', logoScale: 1 },
    typography: { primaryFont: 'Helvetica', secondaryFont: 'Helvetica', customFont: '', baseSize: 11, lineHeight: 1.5 },
    colors: { primary: '#7c3aed', secondary: '#a78bfa', text: '#1f2937', accent: '#ec4899', tableRowBg: '#f5f3ff' },
    layout: { gridGap: 14, padding: 20, tableStyle: 'striped', headerStyle: 'filled' },
    columns: { unite: true, tva: false, remise: false, reference: false },
  },
}

function getDefaultTheme() {
  return JSON.parse(JSON.stringify(THEME_PRESETS.corporate))
}

// ─── Storage keys ─────────────────────────────────────────────────────────────

const KEYS = {
  theme:          'aw-theme',
  savedPresets:   'aw-saved-presets',
  documents:      'aw-documents',
  settings:       'aw-settings',
}

function lsGet(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback } catch { return fallback }
}
function lsSet(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)) } catch { /**/ }
}

// ─── Migrate old theme (missing fields) ──────────────────────────────────────

function migrateTheme(t) {
  if (!t.colors.tableRowBg)        t.colors.tableRowBg      = '#f5f3ff'
  if (!t.typography.customFont)    t.typography.customFont  = ''
  if (!t.typography.lineHeight)    t.typography.lineHeight  = 1.5
  if (t.columns.reference === undefined) t.columns.reference = false
  // Migrate old grey minimalist default — replace with proper corporate colors
  if (t.colors.primary === '#374151' && t.colors.accent === '#374151') {
    const d = JSON.parse(JSON.stringify(THEME_PRESETS.corporate))
    t.colors  = d.colors
    t.layout  = d.layout
  }
  return t
}

// ─── Default settings object ─────────────────────────────────────────────────

function defaultSettings() {
  const browserLang = (navigator.language || navigator.userLanguage || 'fr').toLowerCase()
  return {
    lang: browserLang.startsWith('fr') ? 'fr' : 'en',
    colorMode: 'auto', // 'light' | 'dark' | 'auto'
    taxRegimeId: 'ca-qc',
    customTax: { label: 'Tax', taux: 0 },
    entreprise: {
      nom: '',
      adresse: '',
      ville: '',
      code_postal: '',
      pays: '',
      telephone: '',
      email: '',
      numero_tps: '',
      numero_tvq: '',
      numero_tva: '',
      logo_base64: null,
      devise: 'CAD',
    },
  }
}

// ─── Default (empty) document ─────────────────────────────────────────────────

function newDocument(type = 'devis') {
  const today = todayISO()
  return {
    id: generateId(),
    type,               // 'devis' | 'facture'
    numero: generateDocNumber(type),
    statut: type === 'devis' ? 'brouillon' : 'non_payee',
    date_creation: today,
    date_validite: type === 'devis'    ? addDays30(today) : null,
    date_echeance: type === 'facture'  ? addDays30(today) : null,
    objet: '',
    notes: '',
    conditions: '',
    remise_pct: 0,
    client: { nom: '', entreprise: '', adresse: '', ville: '', code_postal: '', pays: '', email: '' },
    lignes: [],    // [{ id, description, quantite, prix_unitaire, unite, remise_pct, _isSection }]
  }
}

function addDays30(dateStr) {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + 30)
  return d.toISOString().split('T')[0]
}

function newLigne() {
  return { id: generateId(), description: '', quantite: 1, prix_unitaire: 0, unite: 'h', remise_pct: 0, _isSection: false }
}
function newSection() {
  return { id: generateId(), description: '', quantite: 0, prix_unitaire: 0, unite: '', remise_pct: 0, _isSection: true }
}

// ─── Alpine.store registration ────────────────────────────────────────────────

document.addEventListener('alpine:init', () => {

  // ── 0. i18n store ──────────────────────────────────────────────────────────
  Alpine.store('i18n', {
    t(key) {
      const lang = Alpine.store('settings').lang
      const dict = (window.AWI18n && window.AWI18n[lang]) || (window.AWI18n && window.AWI18n.fr) || {}
      return Object.prototype.hasOwnProperty.call(dict, key) ? dict[key] : key
    },
  })

  // ── 1. Theme store ─────────────────────────────────────────────────────────
  Alpine.store('theme', {
    data: migrateTheme(lsGet(KEYS.theme, getDefaultTheme())),
    activePreset: 'custom',
    savedPresets: lsGet(KEYS.savedPresets, []),
    _timer: null,

    persist() {
      clearTimeout(this._timer)
      this._timer = setTimeout(() => lsSet(KEYS.theme, this.data), 150)
    },

    applyPreset(name) {
      const logo = this.data.branding.logoUrl
      this.data = JSON.parse(JSON.stringify(THEME_PRESETS[name]))
      this.data.branding.logoUrl = logo
      this.activePreset = name
      this.persist()
    },

    reset() {
      const logo = this.data.branding.logoUrl
      this.data = getDefaultTheme()
      this.data.branding.logoUrl = logo
      this.activePreset = 'modern'
      this.persist()
    },

    saveAsPreset(name) {
      const trimmed = (name || '').trim()
      if (!trimmed) return
      const entry = { name: trimmed, theme: JSON.parse(JSON.stringify(this.data)), createdAt: new Date().toISOString() }
      const idx = this.savedPresets.findIndex(p => p.name === trimmed)
      if (idx >= 0) this.savedPresets[idx] = entry
      else this.savedPresets.push(entry)
      lsSet(KEYS.savedPresets, this.savedPresets)
    },

    loadSavedPreset(name) {
      const p = this.savedPresets.find(p => p.name === name)
      if (!p) return
      const logo = this.data.branding.logoUrl
      this.data = JSON.parse(JSON.stringify(migrateTheme(p.theme)))
      this.data.branding.logoUrl = logo
      this.activePreset = 'custom'
      this.persist()
    },

    deleteSavedPreset(name) {
      this.savedPresets = this.savedPresets.filter(p => p.name !== name)
      lsSet(KEYS.savedPresets, this.savedPresets)
    },

    exportJson() {
      const blob = new Blob([JSON.stringify({ theme: this.data, exportedAt: new Date().toISOString() }, null, 2)], { type: 'application/json' })
      _download(blob, 'theme-ardoise.json')
    },

    importJson(jsonStr) {
      try {
        const parsed = JSON.parse(jsonStr)
        const t = parsed.theme || parsed
        if (!t.colors || !t.typography || !t.layout) return false
        const logo = this.data.branding.logoUrl
        this.data = migrateTheme(t)
        this.data.branding.logoUrl = logo
        this.activePreset = 'custom'
        this.persist()
        return true
      } catch { return false }
    },

    exportBundle() {
      const bundle = { version: '1', theme: this.data, exportedAt: new Date().toISOString() }
      const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' })
      _download(blob, 'theme-bundle-ardoise.json')
    },

    presetList: [
      { key: 'minimalist', label: 'Minimaliste', primary: '#374151', accent: '#6b7280' },
      { key: 'corporate',  label: 'Corporate',   primary: '#1e3a5f', accent: '#1e40af' },
      { key: 'modern',     label: 'Moderne',      primary: '#7c3aed', accent: '#ec4899' },
    ],

    WEB_SAFE_FONTS: ['System-UI','Inter','Helvetica','Arial','Georgia','Times New Roman',
      'Courier New','Verdana','Trebuchet MS','Palatino','Garamond','Tahoma'],
  })

  // ── 2. Documents store ─────────────────────────────────────────────────────
  Alpine.store('docs', {
    list: lsGet(KEYS.documents, []),

    persist() { lsSet(KEYS.documents, this.list) },

    create(type = 'devis') {
      const doc = newDocument(type)
      this.list.unshift(doc)
      this.persist()
      return doc.id
    },

    getById(id) {
      return this.list.find(d => d.id === id) || null
    },

    save(doc) {
      const idx = this.list.findIndex(d => d.id === doc.id)
      if (idx >= 0) this.list[idx] = JSON.parse(JSON.stringify(doc))
      else this.list.unshift(JSON.parse(JSON.stringify(doc)))
      this.persist()
    },

    delete(id) {
      this.list = this.list.filter(d => d.id !== id)
      this.persist()
    },

    duplicate(id) {
      const orig = this.getById(id)
      if (!orig) return null
      const copy = JSON.parse(JSON.stringify(orig))
      copy.id = generateId()
      copy.numero = generateDocNumber(copy.type)
      copy.statut = copy.type === 'devis' ? 'brouillon' : 'non_payee'
      copy.date_creation = todayISO()
      this.list.unshift(copy)
      this.persist()
      return copy.id
    },

    newLigne,
    newSection,
  })

  // ── 3. Settings store ──────────────────────────────────────────────────────
  Alpine.store('settings', {
    data: (() => {
      const d = lsGet(KEYS.settings, defaultSettings())
      if (!d.customTax) d.customTax = { label: 'Tax', taux: 0 }
      return d
    })(),

    persist() { lsSet(KEYS.settings, this.data) },

    get regime() {
      if (this.data.taxRegimeId === 'ot-custom') {
        const c = this.data.customTax || {}
        return {
          ...getTaxRegimeById('ot-custom'),
          taux_tva: (parseFloat(c.taux) || 0) / 100,
          label_tax3: c.label || 'Tax',
        }
      }
      return getTaxRegimeById(this.data.taxRegimeId)
    },
    get lang() { return this.data.lang },
    get colorMode() { return this.data.colorMode || 'auto' },
    get entreprise() { return this.data.entreprise },
    get devise() { return this.data.entreprise.devise || 'CAD' },
  })
})

// ─── File download helper ─────────────────────────────────────────────────────
function _download(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}

window.THEME_PRESETS = THEME_PRESETS
window.newLigne = newLigne
window.newSection = newSection
