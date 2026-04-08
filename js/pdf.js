// ─── pdf.js ────────────────────────────────────────────────────────────────────
// Port of devis-app/src/utils/pdf.ts → genererPdfThemed()
// Uses window.PDFLib (pdf-lib UMD) + window.fontkit (@pdf-lib/fontkit UMD)
// No Tauri — download via URL.createObjectURL
// ──────────────────────────────────────────────────────────────────────────────
// Note: calculerLigne, calculerTotaux, formaterMontant are globals from utils.js

// ─── Color helpers ────────────────────────────────────────────────────────────

function hexToRgb(hex) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!r) return PDFLib.rgb(0.1, 0.34, 0.86)
  return PDFLib.rgb(parseInt(r[1], 16) / 255, parseInt(r[2], 16) / 255, parseInt(r[3], 16) / 255)
}

// ─── Image helpers ────────────────────────────────────────────────────────────

function imageDataUrlToPngBytes(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth || img.width
      canvas.height = img.naturalHeight || img.height
      const ctx = canvas.getContext('2d')
      if (!ctx) { reject(new Error('Canvas 2D not available')); return }
      ctx.drawImage(img, 0, 0)
      canvas.toBlob(blob => {
        if (!blob) { reject(new Error('toBlob failed')); return }
        blob.arrayBuffer().then(buf => resolve(new Uint8Array(buf))).catch(reject)
      }, 'image/png')
    }
    img.onerror = () => reject(new Error('Image load failed'))
    img.src = dataUrl
  })
}

async function embedLogoImage(pdfDoc, dataUrl) {
  const pngBytes = await imageDataUrlToPngBytes(dataUrl)
  return pdfDoc.embedPng(pngBytes)
}

// ─── Google Font embed (best-effort) ─────────────────────────────────────────

async function tryEmbedGoogleFont(pdfDoc, fontName, bold = false) {
  const builtIn = ['helvetica', 'arial', 'sans-serif', 'system-ui', '']
  if (builtIn.includes((fontName || '').toLowerCase().trim())) return null
  try {
    const weight = bold ? '700' : '400'
    const cssUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName)}:wght@${weight}`
    const cssResp = await fetch(cssUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64)' } })
    if (!cssResp.ok) return null
    const css = await cssResp.text()
    const m = css.match(/url\(([^)]+\.(?:ttf|woff2)[^)']*)\)/)
    if (!m) return null
    const fontUrl = m[1].replace(/['"]/g, '')
    const fontResp = await fetch(fontUrl)
    if (!fontResp.ok) return null
    const fontBytes = new Uint8Array(await fontResp.arrayBuffer())
    pdfDoc.registerFontkit(window.fontkit)
    return await pdfDoc.embedFont(fontBytes)
  } catch { return null }
}

// ─── Word-wrap / clip helpers ─────────────────────────────────────────────────

function wrap(text, font, sz, maxW) {
  const words = String(text || '').split(' ')
  const lines = []
  let cur = ''
  for (const w of words) {
    const t = cur ? cur + ' ' + w : w
    if (font.widthOfTextAtSize(t, sz) > maxW && cur) { lines.push(cur); cur = w } else cur = t
  }
  if (cur) lines.push(cur)
  return lines.length ? lines : ['']
}

function clip(text, font, sz, maxW) {
  let t = String(text || '')
  if (font.widthOfTextAtSize(t, sz) <= maxW) return t
  while (t.length > 0 && font.widthOfTextAtSize(t + '…', sz) > maxW) t = t.slice(0, -1)
  return t + '…'
}

// ─── Main export: genererPdfThemed ────────────────────────────────────────────

async function genererPdfThemed(options) {
  const { PDFDocument, rgb, StandardFonts, degrees } = PDFLib
  const theme = options.theme
  const lang  = options.lang || 'fr'
  const isFr  = lang === 'fr'

  const L = {
    devis:        isFr ? 'DEVIS'        : 'QUOTE',
    facture:      isFr ? 'FACTURE'      : 'INVOICE',
    brouillon:    isFr ? 'BROUILLON'    : 'DRAFT',
    validite:     isFr ? 'Validité'     : 'Valid until',
    echeance:     isFr ? 'Échéance'     : 'Due date',
    date:         isFr ? 'Date'         : 'Date',
    tel:          isFr ? 'Tél'          : 'Tel',
    destinataire: isFr ? 'Destinataire' : 'Bill to',
    objet:        isFr ? 'Objet'        : 'Subject',
    description:  'Description',
    qte:          isFr ? 'Qté'          : 'Qty',
    unite:        isFr ? 'Unité'        : 'Unit',
    pu:           'P.U.',
    remise:       isFr ? 'Rem.'         : 'Disc.',
    remisePct:    isFr ? 'Remise'       : 'Discount',
    tva:          'TVA',
    total:        'Total',
    sousTotal:    isFr ? 'Sous-total'   : 'Subtotal',
    ht:           isFr ? 'HT'           : 'Excl. tax',
    netAPayer:    isFr ? 'NET À PAYER'  : 'TOTAL DUE',
    conditions:   isFr ? 'Conditions'   : 'Terms',
    notes:        isFr ? 'Notes'        : 'Notes',
    page:         isFr ? 'Page'         : 'Page',
    suite:        (n, tot) => `${isFr ? 'Page' : 'Page'} ${n} / ${tot}`,
  }

  const PW = 595.28, PH = 841.89
  const MM = 2.835
  const PX = 0.75

  const pdfDoc = await PDFDocument.create()

  // Fonts
  const fontName = (theme.typography.customFont?.trim() || theme.typography.primaryFont || '').trim()
  const [embR, embB] = await Promise.all([
    tryEmbedGoogleFont(pdfDoc, fontName, false),
    tryEmbedGoogleFont(pdfDoc, fontName, true),
  ])
  const fR = embR || await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fB = embB || await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  // Colors
  const primary   = hexToRgb(theme.colors.primary)
  const secondary = hexToRgb(theme.colors.secondary)
  const textCol   = hexToRgb(theme.colors.text)
  const accentCol = hexToRgb(theme.colors.accent)
  const rowBgCol  = hexToRgb(theme.colors.tableRowBg)
  const blanc     = rgb(1, 1, 1)
  const gray1     = rgb(0.898, 0.906, 0.922)
  const gray2     = rgb(0.820, 0.831, 0.847)
  const redRemise = rgb(0.725, 0.110, 0.110)

  const bs  = theme.typography.baseSize * PX
  const lh  = theme.typography.lineHeight
  const mg  = theme.layout.padding * MM
  const gap = theme.layout.gridGap * PX
  const ent = options.entreprise
  const dev = (ent && ent.devise) || 'CAD'

  // Logo
  let logoImg = null
  const logoSrc = theme.branding.logoUrl || (ent && ent.logo_base64)
  if (logoSrc) { try { logoImg = await embedLogoImage(pdfDoc, logoSrc) } catch { /**/ } }

  const tw = (text, font, sz) => font.widthOfTextAtSize(text, sz)

  // Table layout
  const tableW = PW - 2 * mg
  const showU = theme.columns.unite
  const showR = theme.columns.remise
  const showT = theme.columns.tva
  const qteW   = 32 * PX, uniteW = 38 * PX, puW = 60 * PX, remW = 42 * PX, tvaW = 42 * PX
  const descW  = tableW * 0.40

  const cW = [descW]; const cHdr = [L.description]; const cRt = [false]
  cW.push(qteW);   cHdr.push(L.qte);  cRt.push(true)
  if (showU) { cW.push(uniteW); cHdr.push(L.unite); cRt.push(false) }
  cW.push(puW);    cHdr.push(L.pu);   cRt.push(true)
  if (showR) { cW.push(remW);  cHdr.push(L.remise); cRt.push(true) }
  if (showT) { cW.push(tvaW);  cHdr.push(L.tva);  cRt.push(true) }
  cW.push(tableW - cW.reduce((a, b) => a + b, 0)); cHdr.push(L.total); cRt.push(true)

  const cX = []; let cx0 = mg
  for (const w of cW) { cX.push(cx0); cx0 += w }

  const thPadV = 8 * PX, thPadH = 6 * PX, tdPadV = 7 * PX, tdPadH = 6 * PX
  const thFsz = bs * 0.85, tdFsz = bs * 0.9
  const thH = thFsz * lh + thPadV * 2, tdH = tdFsz * lh + tdPadV * 2

  const totaux = calculerTotaux(
    options.lignes, options.remise_pct,
    (ent && ent.taux_tps) || 0, (ent && ent.taux_tvq) || 0, (ent && ent.taux_tva) || 0
  )
  const tvaPct = ent && ent.taux_tva > 0 ? (ent.taux_tva * 100).toFixed(1) + '%'
               : ent && ent.taux_tps > 0 ? (ent.taux_tps * 100).toFixed(1) + '%' : '0%'

  // Pagination (same algorithm as InvoicePreview.vue)
  const pad_mm = theme.layout.padding, bodyH_mm = 297 - 2 * pad_mm
  const rowH_mm = theme.typography.baseSize * lh * 0.35 + 4
  const allRows = options.lignes; const pages = []

  if (!allRows.length) { pages.push([]) } else {
    let i = 0
    const p1 = Math.max(1, Math.floor((bodyH_mm - 55 - 10 - 8) / rowH_mm))
    pages.push(allRows.slice(0, p1)); i = p1
    while (i < allRows.length) {
      const avail = bodyH_mm - 15 - 10 - 8
      const rem   = allRows.length - i
      const last  = Math.floor((avail - 55) / rowH_mm)
      if (rem <= last) { pages.push(allRows.slice(i)); i = allRows.length }
      else { const n = Math.max(1, Math.floor(avail / rowH_mm)); pages.push(allRows.slice(i, i + n)); i += n }
    }
  }
  const nPages = pages.length

  // ── Draw helpers ────────────────────────────────────────────────────────────

  const drawTHead = (pg, y) => {
    const bot = y - thH
    const tStyle = theme.layout.tableStyle, hStyle = theme.layout.headerStyle
    if (hStyle === 'filled') pg.drawRectangle({ x: mg, y: bot, width: tableW, height: thH, color: primary })
    if (tStyle === 'bordered') {
      const bc = hStyle === 'filled' ? primary : gray2
      pg.drawRectangle({ x: mg, y: bot, width: tableW, height: thH, borderColor: bc, borderWidth: PX })
      for (let ci = 1; ci < cX.length; ci++)
        pg.drawLine({ start: { x: cX[ci], y: bot }, end: { x: cX[ci], y }, thickness: PX, color: bc })
    }
    const thBaseline = bot + (thH - thFsz * 0.72) / 2
    cHdr.forEach((h, ci) => {
      const col = hStyle === 'filled' ? blanc : hStyle === 'none' ? secondary : primary
      const fw = tw(h, fB, thFsz)
      const tx = cRt[ci] ? cX[ci] + cW[ci] - thPadH - fw : cX[ci] + thPadH
      pg.drawText(h, { x: tx, y: thBaseline, size: thFsz, font: fB, color: col })
    })
    if (hStyle === 'none')
      pg.drawLine({ start: { x: mg, y: bot }, end: { x: mg + tableW, y: bot }, thickness: PX, color: gray1 })
    else if (hStyle === 'underline' || tStyle === 'striped')
      pg.drawLine({ start: { x: mg, y: bot }, end: { x: mg + tableW, y: bot }, thickness: 2 * PX, color: primary })
    else if (tStyle === 'minimal')
      pg.drawLine({ start: { x: mg, y: bot }, end: { x: mg + tableW, y: bot }, thickness: PX, color: secondary })
    return bot
  }

  const drawTRow = (pg, y, ligne, ri, isLast) => {
    const bot = y - tdH, tStyle = theme.layout.tableStyle
    if (tStyle === 'striped' && (ri + 1) % 2 === 0)
      pg.drawRectangle({ x: mg, y: bot, width: tableW, height: tdH, color: rowBgCol })
    if (tStyle === 'bordered') {
      pg.drawRectangle({ x: mg, y: bot, width: tableW, height: tdH, borderColor: gray2, borderWidth: PX })
      for (let ci = 1; ci < cX.length; ci++)
        pg.drawLine({ start: { x: cX[ci], y: bot }, end: { x: cX[ci], y }, thickness: PX, color: gray2 })
    }
    if (tStyle === 'minimal' && !isLast)
      pg.drawLine({ start: { x: mg, y: bot }, end: { x: mg + tableW, y: bot }, thickness: PX, color: gray1 })

    const ty = bot + (tdH - tdFsz * 0.72) / 2
    const cell = (text, ci, col = textCol) => {
      const fw = tw(text, fR, tdFsz)
      const tx = cRt[ci] ? cX[ci] + cW[ci] - tdPadH - fw : cX[ci] + tdPadH
      pg.drawText(text, { x: tx, y: ty, size: tdFsz, font: fR, color: col })
    }
    const total = calculerLigne(ligne)
    let ci = 0
    cell(clip(ligne.description || '', fR, tdFsz, cW[0] - tdPadH * 2), ci++)
    cell(String(ligne.quantite), ci++)
    if (showU) cell(ligne.unite || 'h', ci++)
    cell(formaterMontant(ligne.prix_unitaire, dev), ci++)
    if (showR) cell(ligne.remise_pct ? ligne.remise_pct + '%' : '—', ci++)
    if (showT) cell(tvaPct, ci++, secondary)
    cell(formaterMontant(total, dev), ci)
    return bot
  }

  const drawTotauxFooter = (pg) => {
    const totW = 220 * PX, tX = PW - mg - totW, tValX = PW - mg
    const rowSz = bs * 0.9, rowGap = 4 * PX, rowPad = 2 * PX
    const rowHt = rowPad + rowSz * lh + rowPad + rowGap
    const ttcSz = bs * 1.3
    const ttcH  = 4 * PX + 2 * PX + 6 * PX + ttcSz * lh + rowPad

    let totauxH = rowHt + rowHt + rowHt // sous-total + HT + (remise maybe)
    if (totaux.remise > 0) totauxH += rowHt
    if (totaux.tps > 0)   totauxH += rowHt
    if (totaux.tvq > 0)   totauxH += rowHt
    if (totaux.tva > 0)   totauxH += rowHt
    totauxH += ttcH

    const fsz = bs * 0.8, fRowH = fsz * lh, ftW = PW - 2 * mg
    const condLns  = options.conditions ? wrap(options.conditions, fR, fsz, ftW - tw('Conditions : ', fB, fsz)) : []
    const notesLns = options.notes      ? wrap(options.notes,      fR, fsz, ftW - tw('Notes : ',      fB, fsz)) : []
    const hasTax   = !!(ent && (ent.numero_tps || ent.numero_tvq || ent.numero_tva))
    const hasFt    = condLns.length > 0 || notesLns.length > 0 || hasTax

    let footerH = 0
    if (hasFt) {
      footerH += gap
      if (condLns.length)  footerH += fRowH * condLns.length + 6 * PX
      if (notesLns.length) footerH += fRowH * notesLns.length + 6 * PX
      if (hasTax)          footerH += 8 * PX + fsz * 0.9 * lh
    }

    const footerTop  = mg + footerH
    const totauxTop  = footerTop + (hasFt ? gap : 0) + totauxH
    let yt = totauxTop

    const totRow = (label, val, isRem = false, isTtc = false) => {
      const f = isTtc ? fB : fR, sz = isTtc ? ttcSz : rowSz
      const col = isTtc ? accentCol : isRem ? redRemise : textCol
      const vStr = (isRem ? '-' : '') + formaterMontant(Math.abs(val), dev)
      const topOffset = isTtc ? (4 + 2 + 6) * PX : rowPad
      const baseline  = yt - topOffset - sz * 0.8
      pg.drawText(label, { x: tX, y: baseline, size: sz, font: f, color: col })
      pg.drawText(vStr,  { x: tValX - tw(vStr, f, sz), y: baseline, size: sz, font: f, color: col })
      yt -= isTtc ? ttcH : rowHt
    }

    totRow(L.sousTotal, totaux.sous_total)
    if (totaux.remise > 0) totRow(`${L.remisePct} (${options.remise_pct}%)`, totaux.remise, true)
    totRow(L.ht, totaux.ht)
    if (totaux.tps > 0) totRow('TPS', totaux.tps)
    if (totaux.tvq > 0) totRow('TVQ', totaux.tvq)
    if (totaux.tva > 0) totRow('TVA', totaux.tva)

    const borderY = yt - 4 * PX
    pg.drawLine({ start: { x: tX, y: borderY }, end: { x: tValX, y: borderY }, thickness: 2 * PX, color: primary })
    totRow(L.netAPayer, totaux.ttc, false, true)

    if (hasFt) {
      pg.drawLine({ start: { x: mg, y: footerTop }, end: { x: PW - mg, y: footerTop }, thickness: PX, color: gray1 })
      let fy = footerTop - gap
      const drawFtLine = (text, font, xOffset = 0) => {
        pg.drawText(text, { x: mg + xOffset, y: fy - fsz * 0.8, size: fsz, font, color: secondary })
        fy -= fRowH
      }
      if (condLns.length) {
        const lbl = L.conditions + ' : ', lblW = tw(lbl, fB, fsz)
        pg.drawText(lbl,        { x: mg,       y: fy - fsz * 0.8, size: fsz, font: fB, color: textCol })
        pg.drawText(condLns[0], { x: mg + lblW, y: fy - fsz * 0.8, size: fsz, font: fR, color: secondary })
        fy -= fRowH
        for (let i = 1; i < condLns.length; i++) drawFtLine(condLns[i], fR)
        fy -= 6 * PX
      }
      if (notesLns.length) {
        const lbl = L.notes + ' : ', lblW = tw(lbl, fB, fsz)
        pg.drawText(lbl,         { x: mg,       y: fy - fsz * 0.8, size: fsz, font: fB, color: textCol })
        pg.drawText(notesLns[0], { x: mg + lblW, y: fy - fsz * 0.8, size: fsz, font: fR, color: secondary })
        fy -= fRowH
        for (let i = 1; i < notesLns.length; i++) drawFtLine(notesLns[i], fR)
        fy -= 6 * PX
      }
      if (hasTax && ent) {
        fy -= 8 * PX
        const taxSz = fsz * 0.9, taxBase = fy - taxSz * 0.8
        let txX = mg
        if (ent.numero_tps) { const t = `TPS : ${ent.numero_tps}`; pg.drawText(t, { x: txX, y: taxBase, size: taxSz, font: fR, color: secondary }); txX += tw(t, fR, taxSz) + 16 * PX }
        if (ent.numero_tvq) { const t = `TVQ : ${ent.numero_tvq}`; pg.drawText(t, { x: txX, y: taxBase, size: taxSz, font: fR, color: secondary }); txX += tw(t, fR, taxSz) + 16 * PX }
        if (ent.numero_tva) { const t = `TVA : ${ent.numero_tva}`; pg.drawText(t, { x: txX, y: taxBase, size: taxSz, font: fR, color: secondary }) }
      }
    }
  }

  const drawPgNum = (pg, n) => {
    const t = L.suite(n, nPages), sz = bs * 0.75
    pg.drawText(t, { x: PW - mg - tw(t, fR, sz), y: 10 * MM, size: sz, font: fR, color: secondary })
  }

  // ── Render pages ────────────────────────────────────────────────────────────

  for (let pi = 0; pi < nPages; pi++) {
    const pg = pdfDoc.addPage([PW, PH])
    const rows = pages[pi], first = pi === 0, last = pi === nPages - 1
    let y = PH - mg

    if (first) {
      // Watermark
      if (!options.numero || options.numero === 'BROUILLON') {
        const wt = L.brouillon, ws = 72
        pg.drawText(wt, { x: PW / 2 - tw(wt, fB, ws) / 2, y: PH / 2, size: ws, font: fB, color: rgb(0,0,0), opacity: 0.10, rotate: degrees(-45) })
      }

      // Header
      const logoPos = theme.branding.logoPosition, logoScale = theme.branding.logoScale
      let logoW = 0, logoH_pt = 0
      if (logoImg) {
        const s = Math.min((80 * PX) / logoImg.width, (60 * PX) / logoImg.height) * logoScale
        logoW = logoImg.width * s; logoH_pt = logoImg.height * s
      }
      const compNameSz = bs * 1.6, compDetailSz = bs * 0.85
      const docTypeSz  = bs * 2,   docNumSz = bs * 1.1, docDateSz = bs * 0.85
      const dVal = options.type === 'devis' ? options.date_validite : options.date_echeance
      const dLabel = options.type === 'devis' ? L.validite : L.echeance
      const titreStr = options.type === 'devis' ? L.devis : L.facture
      const numStr   = options.numero || L.brouillon
      const entAddr  = ent ? [ent.adresse, [ent.ville, ent.code_postal].filter(Boolean).join(' '), ent.pays].filter(Boolean).join(', ') : ''

      if (logoPos === 'center') {
        let cy = y
        if (logoImg) { pg.drawImage(logoImg, { x: PW/2 - logoW/2, y: cy - logoH_pt, width: logoW, height: logoH_pt }); cy -= logoH_pt + 4 * PX }
        pg.drawText(ent ? ent.nom : '', { x: PW/2 - tw(ent ? ent.nom : '', fB, compNameSz)/2, y: cy - compNameSz*0.8, size: compNameSz, font: fB, color: primary }); cy -= compNameSz * lh
        const cc = (text) => { pg.drawText(text, { x: PW/2 - tw(text, fR, compDetailSz)/2, y: cy - compDetailSz*0.8, size: compDetailSz, font: fR, color: secondary }); cy -= compDetailSz * lh }
        if (entAddr && ent) cc(entAddr); if (ent && ent.telephone) cc(`${L.tel} : ${ent.telephone}`); if (ent && ent.email) cc(ent.email)
        cy -= 6 * PX
        pg.drawText(titreStr, { x: PW/2-tw(titreStr,fB,docTypeSz)/2, y:cy-docTypeSz*0.8, size:docTypeSz, font:fB, color:primary }); cy -= docTypeSz*lh
        pg.drawText(numStr,   { x: PW/2-tw(numStr,fR,docNumSz)/2,    y:cy-docNumSz*0.8,  size:docNumSz,  font:fR, color:secondary }); cy -= docNumSz*lh + 2*PX
        if (options.date_creation) { const t=L.date+' : '+formatDate(options.date_creation); pg.drawText(t,{x:PW/2-tw(t,fR,docDateSz)/2,y:cy-docDateSz*0.8,size:docDateSz,font:fR,color:secondary}); cy-=docDateSz*lh }
        if (dVal) { const t=dLabel+' : '+formatDate(dVal); pg.drawText(t,{x:PW/2-tw(t,fR,docDateSz)/2,y:cy-docDateSz*0.8,size:docDateSz,font:fR,color:secondary}) }
        y -= (y - cy) + gap
      } else {
        const logoX = logoPos === 'right' ? PW - mg - (logoImg ? logoW : 0) : mg
        const compX = logoPos === 'right' ? mg : (logoImg ? mg + logoW + 12 * PX : mg)
        if (logoImg) pg.drawImage(logoImg, { x: logoX, y: y - logoH_pt, width: logoW, height: logoH_pt })

        let cy = y
        if (ent) {
          pg.drawText(ent.nom || '', { x: compX, y: cy - compNameSz*0.8, size: compNameSz, font: fB, color: primary }); cy -= compNameSz*lh
          const det = (text) => { pg.drawText(text,{x:compX,y:cy-compDetailSz*0.8,size:compDetailSz,font:fR,color:secondary}); cy-=compDetailSz*lh }
          if (entAddr) det(entAddr); if (ent.telephone) det(`${L.tel} : ${ent.telephone}`); if (ent.email) det(ent.email)
        }

        const docRX = PW - mg
        let dy = y
        pg.drawText(titreStr, { x: docRX-tw(titreStr,fB,docTypeSz), y:dy-docTypeSz*0.8, size:docTypeSz, font:fB, color:primary }); dy-=docTypeSz*lh
        pg.drawText(numStr,   { x: docRX-tw(numStr,fR,docNumSz),    y:dy-docNumSz*0.8,  size:docNumSz,  font:fR, color:secondary }); dy-=docNumSz*lh+2*PX
        if (options.date_creation) { const t=L.date+' : '+formatDate(options.date_creation); pg.drawText(t,{x:docRX-tw(t,fR,docDateSz),y:dy-docDateSz*0.8,size:docDateSz,font:fR,color:secondary}); dy-=docDateSz*lh }
        if (dVal) { const t=dLabel+' : '+formatDate(dVal); pg.drawText(t,{x:docRX-tw(t,fR,docDateSz),y:dy-docDateSz*0.8,size:docDateSz,font:fR,color:secondary}) }

        y -= Math.max(y - cy, y - dy) + gap
      }

      // Client block
      if (options.client && (options.client.nom || options.client.entreprise)) {
        const c = options.client
        const cAddr = [c.adresse, [c.ville, c.code_postal].filter(Boolean).join(' '), c.pays].filter(Boolean).join(', ')
        const lblSz = bs * 0.8, nameSz = bs * 1.1, addrSz = bs * 0.85
        const innerPadH = 10 * PX, innerPadV = 10 * PX, borderW = 4 * PX
        // Calculate block height
        let blockH = lblSz * lh + 4 * PX + nameSz * lh
        if (c.nom && c.entreprise) blockH += addrSz * lh
        if (cAddr)   blockH += addrSz * lh
        if (c.email) blockH += addrSz * lh
        blockH += innerPadV * 2
        // Background rect (light primary tint) — full content width
        const bgR = hexToRgb(theme.colors.primary)
        pg.drawRectangle({ x: mg, y: y - blockH, width: PW - 2*mg, height: blockH,
          color: PDFLib.rgb(bgR.red*0.06 + 0.94, bgR.green*0.06 + 0.94, bgR.blue*0.06 + 0.94), opacity: 1 })
        // Left border
        pg.drawRectangle({ x: mg, y: y - blockH, width: borderW, height: blockH, color: primary })
        // Text inside
        const tx = mg + borderW + innerPadH
        let ty = y - innerPadV
        pg.drawText(L.destinataire, { x: tx, y: ty-lblSz*0.8, size:lblSz, font:fB, color:primary }); ty -= lblSz*lh + 4*PX
        pg.drawText(c.nom || c.entreprise, { x: tx, y: ty-nameSz*0.8, size:nameSz, font:fB, color:textCol }); ty -= nameSz*lh
        if (c.nom && c.entreprise) { pg.drawText(c.entreprise,{x:tx,y:ty-addrSz*0.8,size:addrSz,font:fR,color:textCol}); ty-=addrSz*lh }
        if (cAddr)  { pg.drawText(cAddr,   {x:tx,y:ty-addrSz*0.8,size:addrSz,font:fR,color:secondary}); ty-=addrSz*lh }
        if (c.email){ pg.drawText(c.email, {x:tx,y:ty-addrSz*0.8,size:addrSz,font:fR,color:secondary}) }
        y -= blockH + gap
      }

      // Objet
      if (options.objet) {
        const sz = bs * 0.95
        const lbl = (isFr ? 'Objet : ' : 'Subject: ')
        pg.drawText(lbl + options.objet, { x:mg, y:y-sz*0.8, size:sz, font:fB, color:textCol }); y -= sz*lh + gap
      }
    } else {
      // Continuation mini-header
      const ctSz = bs * 1.1, ctSubSz = bs * 0.85
      const numStr = options.numero || L.brouillon
      const docLabel = (options.type === 'devis' ? L.devis : L.facture) + ' ' + numStr
      pg.drawText(docLabel, { x:mg, y:y-ctSz*0.8, size:ctSz, font:fB, color:primary })
      if (ent) pg.drawText(ent.nom || '', { x:PW-mg-tw(ent.nom||'',fR,ctSubSz), y:y-ctSubSz*0.8, size:ctSubSz, font:fR, color:secondary })
      pg.drawLine({ start:{x:mg,y:y-ctSz*lh-4*PX}, end:{x:PW-mg,y:y-ctSz*lh-4*PX}, thickness:PX, color:gray1 })
      y -= ctSz * lh + 12 * PX
    }

    // Table
    y = drawTHead(pg, y)
    for (let ri = 0; ri < rows.length; ri++) {
      const ligne = rows[ri]
      if (ligne._isSection) {
        const sz = bs * 0.9
        const sBot = y - tdH
        pg.drawText(ligne.description || '', { x:mg+tdPadH, y: sBot + (tdH - sz * 0.72) / 2, size:sz, font:fB, color:primary })
        y -= tdH
      } else {
        y = drawTRow(pg, y, ligne, ri, ri === rows.length - 1)
      }
    }

    if (last) drawTotauxFooter(pg)
    if (nPages > 1) drawPgNum(pg, pi + 1)
  }

  return await pdfDoc.save()
}

// ─── Download helper ──────────────────────────────────────────────────────────

async function telechargerPdf(data, filename) {
  const blob = new Blob([data], { type: 'application/pdf' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}

async function makePdfBlobUrl(data) {
  const blob = new Blob([data], { type: 'application/pdf' })
  return URL.createObjectURL(blob)
}

// ─── Helper re-used from utils ────────────────────────────────────────────────
function formatDate(d) { if (!d) return new Date().toISOString().split('T')[0]; return String(d).split('T')[0] }

window.AWPdf = { genererPdfThemed, telechargerPdf, makePdfBlobUrl }
