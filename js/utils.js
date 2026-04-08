// ─── Calculs ─────────────────────────────────────────────────────────────────
// Port of devis-app/src/utils/calculs.ts

function calculerLigne(ligne) {
  return ligne.quantite * ligne.prix_unitaire
}

function calculerTotaux(lignes, remise_pct, taux_tps, taux_tvq, taux_tva = 0) {
  const sous_total = lignes.reduce((s, l) => s + calculerLigne(l), 0)
  const remise = sous_total * (remise_pct / 100)
  const ht = sous_total - remise
  const tps = ht * taux_tps
  const tvq = ht * taux_tvq
  const tva = ht * taux_tva
  const ttc = ht + tps + tvq + tva
  return { sous_total, remise, ht, tps, tvq, tva, ttc }
}

function formaterMontant(montant, devise = 'CAD') {
  const symboles = { CAD: '$', EUR: '€', USD: '$', CHF: 'CHF' }
  const s = symboles[devise] || '$'
  return montant.toFixed(2) + ' ' + s
}

// ─── Tax Regimes ─────────────────────────────────────────────────────────────
// Port of devis-app/src/data/taxRegimes.ts (condensed)

const TAX_REGIMES = [
  // Canada — HST
  { id:'ca-on', label:'Ontario — HST 13%',                    group:'Canada',       devise:'CAD', taux_tps:0.13,    taux_tvq:0,       taux_tva:0,      label_tax1:'HST', label_tax2:'',    label_tax3:'' },
  { id:'ca-nb', label:'Nouveau-Brunswick — HST 15%',          labelEn:'New Brunswick — HST 15%',           group:'Canada',       devise:'CAD', taux_tps:0.15,    taux_tvq:0,       taux_tva:0,      label_tax1:'HST', label_tax2:'',    label_tax3:'' },
  { id:'ca-ns', label:'Nouvelle-Écosse — HST 15%',            labelEn:'Nova Scotia — HST 15%',             group:'Canada',       devise:'CAD', taux_tps:0.15,    taux_tvq:0,       taux_tva:0,      label_tax1:'HST', label_tax2:'',    label_tax3:'' },
  { id:'ca-pe', label:'Île-du-Prince-Édouard — HST 15%',      labelEn:'Prince Edward Island — HST 15%',    group:'Canada',       devise:'CAD', taux_tps:0.15,    taux_tvq:0,       taux_tva:0,      label_tax1:'HST', label_tax2:'',    label_tax3:'' },
  { id:'ca-nl', label:'Terre-Neuve — HST 15%',                labelEn:'Newfoundland — HST 15%',            group:'Canada',       devise:'CAD', taux_tps:0.15,    taux_tvq:0,       taux_tva:0,      label_tax1:'HST', label_tax2:'',    label_tax3:'' },
  // Canada — GST+PST/QST
  { id:'ca-qc', label:'Québec — TPS 5% + TVQ 9.975%',         labelEn:'Quebec — GST 5% + QST 9.975%',     group:'Canada',       devise:'CAD', taux_tps:0.05,    taux_tvq:0.09975, taux_tva:0,      label_tax1:'TPS', label_tax2:'TVQ', label_tax3:'' },
  { id:'ca-bc', label:'Colombie-Britannique — GST 5% + PST 7%',labelEn:'British Columbia — GST 5% + PST 7%',group:'Canada',      devise:'CAD', taux_tps:0.05,    taux_tvq:0.07,    taux_tva:0,      label_tax1:'GST', label_tax2:'PST', label_tax3:'' },
  { id:'ca-sk', label:'Saskatchewan — GST 5% + PST 6%',       group:'Canada',       devise:'CAD', taux_tps:0.05,    taux_tvq:0.06,    taux_tva:0,      label_tax1:'GST', label_tax2:'PST', label_tax3:'' },
  { id:'ca-mb', label:'Manitoba — GST 5% + PST 7%',           group:'Canada',       devise:'CAD', taux_tps:0.05,    taux_tvq:0.07,    taux_tva:0,      label_tax1:'GST', label_tax2:'PST', label_tax3:'' },
  // Canada — GST only
  { id:'ca-ab', label:'Alberta — GST 5%',                     group:'Canada',       devise:'CAD', taux_tps:0.05,    taux_tvq:0,       taux_tva:0,      label_tax1:'GST', label_tax2:'',    label_tax3:'' },
  { id:'ca-nt', label:'Territoires du Nord-Ouest — GST 5%',   labelEn:'Northwest Territories — GST 5%',    group:'Canada',       devise:'CAD', taux_tps:0.05,    taux_tvq:0,       taux_tva:0,      label_tax1:'GST', label_tax2:'',    label_tax3:'' },
  { id:'ca-nu', label:'Nunavut — GST 5%',                     group:'Canada',       devise:'CAD', taux_tps:0.05,    taux_tvq:0,       taux_tva:0,      label_tax1:'GST', label_tax2:'',    label_tax3:'' },
  { id:'ca-yt', label:'Yukon — GST 5%',                       group:'Canada',       devise:'CAD', taux_tps:0.05,    taux_tvq:0,       taux_tva:0,      label_tax1:'GST', label_tax2:'',    label_tax3:'' },
  // États-Unis (sales tax dans taux_tva)
  { id:'us-al', label:'Alabama — 4%',         group:'États-Unis', devise:'USD', taux_tps:0, taux_tvq:0, taux_tva:0.04,    label_tax1:'', label_tax2:'', label_tax3:'Sales Tax' },
  { id:'us-ak', label:'Alaska — 0%',          group:'États-Unis', devise:'USD', taux_tps:0, taux_tvq:0, taux_tva:0,       label_tax1:'', label_tax2:'', label_tax3:'Sales Tax' },
  { id:'us-az', label:'Arizona — 5.6%',       group:'États-Unis', devise:'USD', taux_tps:0, taux_tvq:0, taux_tva:0.056,   label_tax1:'', label_tax2:'', label_tax3:'Sales Tax' },
  { id:'us-ca', label:'California — 7.25%',   group:'États-Unis', devise:'USD', taux_tps:0, taux_tvq:0, taux_tva:0.0725,  label_tax1:'', label_tax2:'', label_tax3:'Sales Tax' },
  { id:'us-co', label:'Colorado — 2.9%',      group:'États-Unis', devise:'USD', taux_tps:0, taux_tvq:0, taux_tva:0.029,   label_tax1:'', label_tax2:'', label_tax3:'Sales Tax' },
  { id:'us-ct', label:'Connecticut — 6.35%',  group:'États-Unis', devise:'USD', taux_tps:0, taux_tvq:0, taux_tva:0.0635,  label_tax1:'', label_tax2:'', label_tax3:'Sales Tax' },
  { id:'us-de', label:'Delaware — 0%',        group:'États-Unis', devise:'USD', taux_tps:0, taux_tvq:0, taux_tva:0,       label_tax1:'', label_tax2:'', label_tax3:'Sales Tax' },
  { id:'us-fl', label:'Florida — 6%',         group:'États-Unis', devise:'USD', taux_tps:0, taux_tvq:0, taux_tva:0.06,    label_tax1:'', label_tax2:'', label_tax3:'Sales Tax' },
  { id:'us-ga', label:'Georgia — 4%',         group:'États-Unis', devise:'USD', taux_tps:0, taux_tvq:0, taux_tva:0.04,    label_tax1:'', label_tax2:'', label_tax3:'Sales Tax' },
  { id:'us-il', label:'Illinois — 6.25%',     group:'États-Unis', devise:'USD', taux_tps:0, taux_tvq:0, taux_tva:0.0625,  label_tax1:'', label_tax2:'', label_tax3:'Sales Tax' },
  { id:'us-in', label:'Indiana — 7%',         group:'États-Unis', devise:'USD', taux_tps:0, taux_tvq:0, taux_tva:0.07,    label_tax1:'', label_tax2:'', label_tax3:'Sales Tax' },
  { id:'us-ma', label:'Massachusetts — 6.25%',group:'États-Unis', devise:'USD', taux_tps:0, taux_tvq:0, taux_tva:0.0625,  label_tax1:'', label_tax2:'', label_tax3:'Sales Tax' },
  { id:'us-mi', label:'Michigan — 6%',        group:'États-Unis', devise:'USD', taux_tps:0, taux_tvq:0, taux_tva:0.06,    label_tax1:'', label_tax2:'', label_tax3:'Sales Tax' },
  { id:'us-mn', label:'Minnesota — 6.875%',   group:'États-Unis', devise:'USD', taux_tps:0, taux_tvq:0, taux_tva:0.06875, label_tax1:'', label_tax2:'', label_tax3:'Sales Tax' },
  { id:'us-ny', label:'New York — 4%',        group:'États-Unis', devise:'USD', taux_tps:0, taux_tvq:0, taux_tva:0.04,    label_tax1:'', label_tax2:'', label_tax3:'Sales Tax' },
  { id:'us-nj', label:'New Jersey — 6.625%',  group:'États-Unis', devise:'USD', taux_tps:0, taux_tvq:0, taux_tva:0.06625, label_tax1:'', label_tax2:'', label_tax3:'Sales Tax' },
  { id:'us-oh', label:'Ohio — 5.75%',         group:'États-Unis', devise:'USD', taux_tps:0, taux_tvq:0, taux_tva:0.0575,  label_tax1:'', label_tax2:'', label_tax3:'Sales Tax' },
  { id:'us-pa', label:'Pennsylvania — 6%',    group:'États-Unis', devise:'USD', taux_tps:0, taux_tvq:0, taux_tva:0.06,    label_tax1:'', label_tax2:'', label_tax3:'Sales Tax' },
  { id:'us-tx', label:'Texas — 6.25%',        group:'États-Unis', devise:'USD', taux_tps:0, taux_tvq:0, taux_tva:0.0625,  label_tax1:'', label_tax2:'', label_tax3:'Sales Tax' },
  { id:'us-wa', label:'Washington — 6.5%',    group:'États-Unis', devise:'USD', taux_tps:0, taux_tvq:0, taux_tva:0.065,   label_tax1:'', label_tax2:'', label_tax3:'Sales Tax' },
  { id:'us-or', label:'Oregon — 0%',          group:'États-Unis', devise:'USD', taux_tps:0, taux_tvq:0, taux_tva:0,       label_tax1:'', label_tax2:'', label_tax3:'Sales Tax' },
  // Union Européenne — TVA
  { id:'eu-fr', label:'France — TVA 20%',          labelEn:'France — VAT 20%',          group:'Europe', devise:'EUR', taux_tps:0, taux_tvq:0, taux_tva:0.20,  label_tax1:'', label_tax2:'', label_tax3:'TVA' },
  { id:'eu-de', label:'Allemagne — TVA 19%',        labelEn:'Germany — VAT 19%',         group:'Europe', devise:'EUR', taux_tps:0, taux_tvq:0, taux_tva:0.19,  label_tax1:'', label_tax2:'', label_tax3:'TVA' },
  { id:'eu-es', label:'Espagne — TVA 21%',          labelEn:'Spain — VAT 21%',           group:'Europe', devise:'EUR', taux_tps:0, taux_tvq:0, taux_tva:0.21,  label_tax1:'', label_tax2:'', label_tax3:'TVA' },
  { id:'eu-it', label:'Italie — TVA 22%',           labelEn:'Italy — VAT 22%',           group:'Europe', devise:'EUR', taux_tps:0, taux_tvq:0, taux_tva:0.22,  label_tax1:'', label_tax2:'', label_tax3:'TVA' },
  { id:'eu-be', label:'Belgique — TVA 21%',         labelEn:'Belgium — VAT 21%',         group:'Europe', devise:'EUR', taux_tps:0, taux_tvq:0, taux_tva:0.21,  label_tax1:'', label_tax2:'', label_tax3:'TVA' },
  { id:'eu-nl', label:'Pays-Bas — TVA 21%',         labelEn:'Netherlands — VAT 21%',     group:'Europe', devise:'EUR', taux_tps:0, taux_tvq:0, taux_tva:0.21,  label_tax1:'', label_tax2:'', label_tax3:'TVA' },
  { id:'eu-pt', label:'Portugal — TVA 23%',         labelEn:'Portugal — VAT 23%',        group:'Europe', devise:'EUR', taux_tps:0, taux_tvq:0, taux_tva:0.23,  label_tax1:'', label_tax2:'', label_tax3:'TVA' },
  { id:'eu-at', label:'Autriche — TVA 20%',         labelEn:'Austria — VAT 20%',         group:'Europe', devise:'EUR', taux_tps:0, taux_tvq:0, taux_tva:0.20,  label_tax1:'', label_tax2:'', label_tax3:'TVA' },
  { id:'eu-ch', label:'Suisse — TVA 8.1%',          labelEn:'Switzerland — VAT 8.1%',    group:'Europe', devise:'CHF', taux_tps:0, taux_tvq:0, taux_tva:0.081, label_tax1:'', label_tax2:'', label_tax3:'TVA' },
  { id:'eu-lu', label:'Luxembourg — TVA 17%',       labelEn:'Luxembourg — VAT 17%',      group:'Europe', devise:'EUR', taux_tps:0, taux_tvq:0, taux_tva:0.17,  label_tax1:'', label_tax2:'', label_tax3:'TVA' },
  // Autres
  { id:'ot-00',     label:'Sans taxe (0%)',  labelEn:'No tax (0%)',  group:'Autre', devise:'CAD', taux_tps:0, taux_tvq:0, taux_tva:0, label_tax1:'', label_tax2:'', label_tax3:'' },
  { id:'ot-custom', label:'Personnalisé',    labelEn:'Custom',       group:'Autre', devise:'CAD', taux_tps:0, taux_tvq:0, taux_tva:0, label_tax1:'', label_tax2:'', label_tax3:'Tax' },
]

const TAX_GROUP_LABELS = {
  'Canada':      { fr: 'Canada',      en: 'Canada' },
  'États-Unis':  { fr: 'États-Unis',  en: 'United States' },
  'Europe':      { fr: 'Europe',      en: 'Europe' },
  'Autre':       { fr: 'Autre',       en: 'Other' },
}

function getTaxRegimeGroups(lang) {
  const isEn = lang === 'en'
  const groups = {}
  for (const r of TAX_REGIMES) {
    const groupKey = isEn ? (TAX_GROUP_LABELS[r.group]?.en || r.group) : r.group
    if (!groups[groupKey]) groups[groupKey] = []
    groups[groupKey].push({ ...r, label: isEn ? (r.labelEn || r.label) : r.label })
  }
  return groups
}

function getTaxRegimeById(id) {
  return TAX_REGIMES.find(r => r.id === id) || TAX_REGIMES.find(r => r.id === 'ot-00')
}

function getTaxLabelsForRegime(regime) {
  if (!regime) return { lbl1: '', lbl2: '', lbl3: '' }
  return { lbl1: regime.label_tax1, lbl2: regime.label_tax2, lbl3: regime.label_tax3 }
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

function todayISO() {
  return new Date().toISOString().split('T')[0]
}

function formatDate(d) {
  if (!d) return todayISO()
  return String(d).split('T')[0]
}

function addDays(dateStr, days) {
  const d = new Date(dateStr || todayISO())
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

// ─── Address helpers ──────────────────────────────────────────────────────────

function buildAddress(obj) {
  if (!obj) return ''
  return [obj.adresse, [obj.ville, obj.code_postal].filter(Boolean).join(' '), obj.pays]
    .filter(Boolean).join(', ')
}

// ─── ID generator ─────────────────────────────────────────────────────────────

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

function generateDocNumber(type) {
  const year = new Date().getFullYear()
  const seq = String(Math.floor(Math.random() * 9000) + 1000)
  return (type === 'facture' ? 'FACT' : 'DEVIS') + '-' + year + '-' + seq
}

// Export all so they can be used in other scripts that load after this one
window.AWUtils = {
  calculerLigne, calculerTotaux, formaterMontant,
  TAX_REGIMES, getTaxRegimeGroups, getTaxRegimeById, getTaxLabelsForRegime,
  todayISO, formatDate, addDays, buildAddress,
  generateId, generateDocNumber,
}
