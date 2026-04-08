/**
 * Ardoise — internationalization (FR / EN)
 * All UI strings are stored here. Access via $store.i18n.t('key').
 */
window.AWI18n = {
  fr: {
    // Sidebar
    nav: 'Navigation',
    navDocuments: 'Documents',
    navNouveau: 'Nouveau',
    navDesigner: 'Designer',
    navParametres: 'Paramètres',

    // Documents list
    pageDocuments: 'Documents',
    btnPlusDevis: '+ Devis',
    btnPlusFacture: '+ Facture',
    filterTous: 'Tous',
    filterDevis: 'Devis',
    filterFactures: 'Factures',
    colType: 'Type',
    colNumero: 'Numéro',
    colClient: 'Client',
    colObjet: 'Objet',
    colStatut: 'Statut',
    colDate: 'Date',
    colTotalTtc: 'Total TTC',
    badgeDevis: 'Devis',
    badgeFacture: 'Facture',
    ttipApercuPdf: 'Aperçu PDF',
    ttipTelechargerPdf: 'Télécharger PDF',
    ttipDupliquer: 'Dupliquer',
    ttipSupprimer: 'Supprimer',
    aucunDocument: 'Aucun document. Créez votre premier devis ou facture.',

    // Document form — header actions
    btnRetour: '← Retour',
    btnApercuPdf: 'Aperçu PDF',
    btnGeneration: 'Génération…',
    btnPdf: '↓ PDF',
    btnSauvegarder: 'Sauvegarder',

    // Document form — type switch
    typeDevis: 'Devis',
    typeFacture: 'Facture',

    // Document form — meta card
    cardInformations: 'Informations',
    labelNumero: 'Numéro',
    labelStatut: 'Statut',
    labelDateEmission: "Date d'émission",
    labelValableJusquau: "Valable jusqu'au",
    labelDateEcheance: "Date d'échéance",
    labelObjet: 'Objet',

    // Status options (for <select> and badges)
    statutBrouillon: 'Brouillon',
    statutEnvoye: 'Envoyé',
    statutAccepte: 'Accepté',
    statutRefuse: 'Refusé',
    statutNonPayee: 'Non payée',
    statutPayee: 'Payée',
    statutEnRetard: 'En retard',

    // Document form — client card
    cardClient: 'Client',
    labelNom: 'Nom',
    labelEntreprise: 'Entreprise',
    labelAdresse: 'Adresse',
    labelVille: 'Ville',
    labelCodePostal: 'Code postal',
    labelPays: 'Pays',
    labelEmail: 'Email',

    // Document form — lines card
    cardLignes: 'Lignes',
    btnSection: '+ Section',
    btnLigne: '+ Ligne',
    colDescription: 'Description',
    colQte: 'Qté',
    colUnite: 'Unité',
    colPu: 'P.U.',
    colRemisePct: 'Remise %',
    colTotalHt: 'Total HT',
    phTitreSection: 'Titre de section…',
    phDescription: 'Description…',
    aucuneLigne: 'Aucune ligne. Cliquez sur « + Ligne » pour commencer.',

    // Document form — notes card
    labelRemiseGlobale: 'Remise globale (%)',
    labelNotes: 'Notes',
    labelConditions: 'Conditions de paiement',
    phNotes: 'Notes internes ou message au client…',
    phConditions: 'Ex : Paiement à 30 jours…',

    // Document form — totaux sidebar
    cardTotaux: 'Totaux',
    labelSousTotal: 'Sous-total',
    labelRemise: 'Remise',
    labelHt: 'HT',
    labelTotalTtc: 'Total TTC',

    // Preview thumbnail label
    labelApercu: 'Aperçu',

    // PDF modal
    modalApercuPdf: 'Aperçu PDF',

    // Designer — presets
    presetsBase: 'Présets de base',
    presetMinimaliste: 'Minimaliste',
    presetCorporate: 'Corporate',
    presetModerne: 'Moderne',

    // Designer — saved designs
    mesDesigns: 'Mes designs',
    btnSauver: 'Sauver',
    phNomDesign: 'Nom du design…',

    // Designer — colors
    sectionCouleurs: 'Couleurs',
    couleurPrincipale: 'Principale',
    couleurSecondaire: 'Secondaire',
    couleurTexte: 'Texte',
    couleurAccent: 'Accent',
    couleurFondRangees: 'Fond rangées',

    // Designer — typography
    sectionTypographie: 'Typographie',
    labelPolicePrincipale: 'Police principale',
    labelPoliceCustom: 'Police personnalisée',
    labelTailleBase: 'Taille de base',
    labelInterligne: 'Interligne',

    // Designer — layout
    sectionMiseEnPage: 'Mise en page',
    labelMarges: 'Marges',
    labelEspacement: 'Espacement',

    // Designer — table style
    sectionStyleTableau: 'Style tableau',
    labelStyleLignes: 'Style des lignes',
    labelStyleEntete: 'Style entête',
    optLignesAlternees: 'Lignes alternées',
    optBordures: 'Bordures',
    optMinimal: 'Minimal',
    optRempli: 'Rempli',
    optSouligne: 'Souligné',
    optAucun: 'Aucun',

    // Designer — visible columns
    sectionColonnes: 'Colonnes visibles',
    colToggleUnite: 'Unité',
    colToggleRemise: 'Remise',
    colToggleTva: 'TVA / TPS',

    // Designer — logo
    sectionLogo: 'Logo',
    logoGlisserCliquer: 'Glisser ou cliquer',
    btnSupprimerLogo: 'Supprimer',
    logoPosGauche: 'Gauche',
    logoPosCentre: 'Centre',
    logoPosDroite: 'Droite',

    // Designer — actions
    sectionActions: 'Actions',
    labelZoom: 'Zoom',
    btnPdfApercu: '↓ PDF aperçu',
    btnExporterJson: '↓ Exporter JSON',
    btnImporterJson: '↑ Importer JSON',
    btnReinitialiser: 'Réinitialiser',

    // Settings page
    pageParametres: 'Paramètres',
    settingsMadeBy: 'par',
    btnSaveSettings: 'Sauvegarder',
    labelCustomTax: 'Taxe personnalisée',
    labelCustomTaxLabel: 'Nom de la taxe',
    labelCustomTaxRate: 'Taux (%)',
    cardMonEntreprise: 'Mon entreprise',
    labelTelephone: 'Téléphone',
    labelSiteWeb: 'Site web',
    labelSiret: "SIRET / Numéro d'entreprise",
    labelNumeroTva: 'Numéro TVA / TPS',
    labelMentionsLegales: 'Mentions légales',
    labelLogoEntreprise: "Logo de l'entreprise",
    btnChoisirFichier: 'Choisir un fichier',
    btnSupprimerLogo2: 'Supprimer',
    cardFiscaliteLangue: 'Fiscalité & Langue',
    labelRegimeFiscal: 'Régime fiscal / Zone',
    labelDevise: 'Devise',
    labelLangueDocs: 'Langue des documents',
    langFr: 'Français',
    langEn: 'English',

    // Sidebar disclaimer
    sidebarDisclaimerTitle: 'Stockage local',
    sidebarDisclaimerBody: 'Vos données (devis, factures, paramètres) sont enregistrées exclusivement dans le stockage local de votre navigateur. Aucune information n\u2019est transmise à des serveurs externes.',

    // Cookie consent
    cookieTitle: 'Cookies & confidentialité',
    cookieBody: 'Nous utilisons des cookies nécessaires au fonctionnement de l\u2019application. Avec votre accord, nous activons également des cookies publicitaires (Google AdSense) pour financer le développement.',
    cookieAcceptAll: 'Tout accepter',
    cookieRejectAll: 'Refuser',
    cookieManage: 'Gérer les préférences',
    cookieSave: 'Enregistrer mes choix',
    cookieNecessaryTitle: 'Cookies nécessaires',
    cookieNecessaryDesc: 'Indispensables au fonctionnement de l\u2019application (stockage local, préférences). Ne peuvent pas être désactivés.',
    cookieAdsTitle: 'Publicité (AdSense)',
    cookieAdsDesc: 'Permettent d\u2019afficher des publicités personnalisées via Google AdSense afin de financer l\u2019application gratuitement.',
    cookieSettingsTitle: 'Cookies & publicité',
    cookieSettingsDesc: 'Consultez ou modifiez vos préférences de cookies à tout moment.',
    cookieSettingsBtn: 'Gérer mes préférences de cookies',

    // Currency options
    deviseCAD: 'CAD — Dollar canadien',
    deviseUSD: 'USD — Dollar américain',
    deviseEUR: 'EUR — Euro',
    deviseGBP: 'GBP — Livre sterling',
    deviseChf: 'CHF — Franc suisse',
    deviseJPY: 'JPY — Yen',
    deviseAUD: 'AUD — Dollar australien',
  },

  en: {
    // Sidebar
    nav: 'Navigation',
    navDocuments: 'Documents',
    navNouveau: 'New',
    navDesigner: 'Designer',
    navParametres: 'Settings',

    // Documents list
    pageDocuments: 'Documents',
    btnPlusDevis: '+ Quote',
    btnPlusFacture: '+ Invoice',
    filterTous: 'All',
    filterDevis: 'Quotes',
    filterFactures: 'Invoices',
    colType: 'Type',
    colNumero: 'Number',
    colClient: 'Client',
    colObjet: 'Subject',
    colStatut: 'Status',
    colDate: 'Date',
    colTotalTtc: 'Total',
    badgeDevis: 'Quote',
    badgeFacture: 'Invoice',
    ttipApercuPdf: 'PDF Preview',
    ttipTelechargerPdf: 'Download PDF',
    ttipDupliquer: 'Duplicate',
    ttipSupprimer: 'Delete',
    aucunDocument: 'No documents. Create your first quote or invoice.',

    // Document form — header actions
    btnRetour: '← Back',
    btnApercuPdf: 'PDF Preview',
    btnGeneration: 'Generating…',
    btnPdf: '↓ PDF',
    btnSauvegarder: 'Save',

    // Document form — type switch
    typeDevis: 'Quote',
    typeFacture: 'Invoice',

    // Document form — meta card
    cardInformations: 'Information',
    labelNumero: 'Number',
    labelStatut: 'Status',
    labelDateEmission: 'Issue date',
    labelValableJusquau: 'Valid until',
    labelDateEcheance: 'Due date',
    labelObjet: 'Subject',

    // Status options
    statutBrouillon: 'Draft',
    statutEnvoye: 'Sent',
    statutAccepte: 'Accepted',
    statutRefuse: 'Rejected',
    statutNonPayee: 'Unpaid',
    statutPayee: 'Paid',
    statutEnRetard: 'Overdue',

    // Document form — client card
    cardClient: 'Client',
    labelNom: 'Name',
    labelEntreprise: 'Company',
    labelAdresse: 'Address',
    labelVille: 'City',
    labelCodePostal: 'Postal code',
    labelPays: 'Country',
    labelEmail: 'Email',

    // Document form — lines card
    cardLignes: 'Lines',
    btnSection: '+ Section',
    btnLigne: '+ Line',
    colDescription: 'Description',
    colQte: 'Qty',
    colUnite: 'Unit',
    colPu: 'Unit price',
    colRemisePct: 'Disc. %',
    colTotalHt: 'Total',
    phTitreSection: 'Section title…',
    phDescription: 'Description…',
    aucuneLigne: 'No lines. Click on « + Line » to start.',

    // Document form — notes card
    labelRemiseGlobale: 'Global discount (%)',
    labelNotes: 'Notes',
    labelConditions: 'Payment terms',
    phNotes: 'Internal notes or message to client…',
    phConditions: 'E.g.: Payment within 30 days…',

    // Document form — totaux sidebar
    cardTotaux: 'Totals',
    labelSousTotal: 'Subtotal',
    labelRemise: 'Discount',
    labelHt: 'Before tax',
    labelTotalTtc: 'Total',

    // Preview thumbnail label
    labelApercu: 'Preview',

    // PDF modal
    modalApercuPdf: 'PDF Preview',

    // Designer — presets
    presetsBase: 'Base presets',
    presetMinimaliste: 'Minimalist',
    presetCorporate: 'Corporate',
    presetModerne: 'Modern',

    // Designer — saved designs
    mesDesigns: 'My designs',
    btnSauver: 'Save',
    phNomDesign: 'Design name…',

    // Designer — colors
    sectionCouleurs: 'Colors',
    couleurPrincipale: 'Primary',
    couleurSecondaire: 'Secondary',
    couleurTexte: 'Text',
    couleurAccent: 'Accent',
    couleurFondRangees: 'Row background',

    // Designer — typography
    sectionTypographie: 'Typography',
    labelPolicePrincipale: 'Primary font',
    labelPoliceCustom: 'Custom font',
    labelTailleBase: 'Base size',
    labelInterligne: 'Line height',

    // Designer — layout
    sectionMiseEnPage: 'Layout',
    labelMarges: 'Margins',
    labelEspacement: 'Spacing',

    // Designer — table style
    sectionStyleTableau: 'Table style',
    labelStyleLignes: 'Row style',
    labelStyleEntete: 'Header style',
    optLignesAlternees: 'Striped rows',
    optBordures: 'Bordered',
    optMinimal: 'Minimal',
    optRempli: 'Filled',
    optSouligne: 'Underline',
    optAucun: 'None',

    // Designer — visible columns
    sectionColonnes: 'Visible columns',
    colToggleUnite: 'Unit',
    colToggleRemise: 'Discount',
    colToggleTva: 'VAT / GST',

    // Designer — logo
    sectionLogo: 'Logo',
    logoGlisserCliquer: 'Drag or click',
    btnSupprimerLogo: 'Delete',
    logoPosGauche: 'Left',
    logoPosCentre: 'Center',
    logoPosDroite: 'Right',

    // Designer — actions
    sectionActions: 'Actions',
    labelZoom: 'Zoom',
    btnPdfApercu: '↓ Preview PDF',
    btnExporterJson: '↓ Export JSON',
    btnImporterJson: '↑ Import JSON',
    btnReinitialiser: 'Reset',

    // Settings page
    pageParametres: 'Settings',
    settingsMadeBy: 'by',
    btnSaveSettings: 'Save',
    labelCustomTax: 'Custom tax',
    labelCustomTaxLabel: 'Tax name',
    labelCustomTaxRate: 'Rate (%)',
    cardMonEntreprise: 'My company',
    labelTelephone: 'Phone',
    labelSiteWeb: 'Website',
    labelSiret: 'Company number',
    labelNumeroTva: 'VAT / GST number',
    labelMentionsLegales: 'Legal notices',
    labelLogoEntreprise: 'Company logo',
    btnChoisirFichier: 'Choose file',
    btnSupprimerLogo2: 'Delete',
    cardFiscaliteLangue: 'Tax & Language',
    labelRegimeFiscal: 'Tax regime / Zone',
    labelDevise: 'Currency',
    labelLangueDocs: 'Document language',
    langFr: 'Français',
    langEn: 'English',

    // Sidebar disclaimer
    sidebarDisclaimerTitle: 'Local storage',
    sidebarDisclaimerBody: 'Your data (quotes, invoices, settings) is stored exclusively in your browser\u2019s local storage. No information is ever transmitted to external servers.',

    // Cookie consent
    cookieTitle: 'Cookies & privacy',
    cookieBody: 'We use cookies essential to the application\u2019s operation. With your consent, we also enable advertising cookies (Google AdSense) to help fund development.',
    cookieAcceptAll: 'Accept all',
    cookieRejectAll: 'Reject all',
    cookieManage: 'Manage preferences',
    cookieSave: 'Save my choices',
    cookieNecessaryTitle: 'Necessary cookies',
    cookieNecessaryDesc: 'Required for the application to function (local storage, preferences). Cannot be disabled.',
    cookieAdsTitle: 'Advertising (AdSense)',
    cookieAdsDesc: 'Allow personalized ads to be shown via Google AdSense to help fund the free application.',
    cookieSettingsTitle: 'Cookies & advertising',
    cookieSettingsDesc: 'Review or update your cookie preferences at any time.',
    cookieSettingsBtn: 'Manage my cookie preferences',

    // Currency options
    deviseCAD: 'CAD — Canadian Dollar',
    deviseUSD: 'USD — US Dollar',
    deviseEUR: 'EUR — Euro',
    deviseGBP: 'GBP — Pound sterling',
    deviseChf: 'CHF — Swiss franc',
    deviseJPY: 'JPY — Yen',
    deviseAUD: 'AUD — Australian Dollar',
  }
}
