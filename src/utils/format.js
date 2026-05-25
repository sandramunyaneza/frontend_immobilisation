const METHODE_LABELS = {
  LINEAIRE: 'Linéaire',
  DEGRESSIF: 'Dégressif',
  PAR_COMPOSANT: 'Par composant',
};

const STATUT_IMMO_LABELS = {
  ACTIF: 'Opérationnel',
  EN_MAINTENANCE: 'En maintenance',
  HORS_SERVICE: 'Hors service',
  REMPLACE: 'Remplacé',
  SORTI: 'Sorti',
};

const ETAT_LABELS = {
  BON: 'Bon',
  MOYEN: 'Moyen',
  MAUVAIS: 'Mauvais',
  HORS_SERVICE: 'Hors service',
};

const RAPPORT_TYPE_LABELS = {
  FINANCIER: 'Rapport financier',
  AMORTISSEMENT: "Rapport d'amortissement",
  TECHNIQUE: 'Rapport technique',
  MAINTENANCE: 'Rapport maintenance',
  STOCK: 'Rapport stock',
  AUDIT: 'Rapport audit',
};

export function formatMethode(methode) {
  return METHODE_LABELS[methode] || methode || '—';
}

export function formatStatutImmo(statut) {
  return STATUT_IMMO_LABELS[statut] || statut || '—';
}

export function formatEtat(etat) {
  return ETAT_LABELS[etat] || etat || '—';
}

export function formatRapportType(type) {
  return RAPPORT_TYPE_LABELS[type] || type || '—';
}

export function formatCurrency(value) {
  if (value == null || value === '') return '—';
  const n = Number(value);
  if (Number.isNaN(n)) return '—';
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
}

/** Montants en dollars (module magasinier) */
export function formatDollar(value) {
  if (value == null || value === '') return '—';
  const n = Number(value);
  if (Number.isNaN(n)) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

export function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('fr-FR');
}

/** Rapports pertinents pour le module comptable */
export function isRapportComptable(rapport) {
  const t = (rapport?.type_rapport || '').toUpperCase();
  return t === 'FINANCIER' || t === 'AMORTISSEMENT';
}
