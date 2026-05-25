/** État du stock selon quantité et seuil */
export function getStockEtat(quantite, seuil) {
  const q = Number(quantite) || 0;
  const s = Number(seuil) ?? 1;
  if (q <= 0) return { label: 'Rupture', variant: 'danger' };
  if (q <= s) return { label: 'Stock faible', variant: 'warning' };
  return { label: 'Stock suffisant', variant: 'success' };
}

const TYPE_MOUVEMENT_LABELS = {
  ENTREE: 'Entrée',
  SORTIE: 'Sortie',
  AJUSTEMENT: 'Ajustement',
};

const STATUT_DEMANDE_LABELS = {
  EN_ATTENTE: 'En attente',
  VALIDEE: 'Validée',
  REFUSEE: 'Refusée',
  FOURNIE: 'Fournie',
  ANNULEE: 'Annulée',
};

export function formatTypeMouvement(type) {
  return TYPE_MOUVEMENT_LABELS[type] || type || '—';
}

export function formatStatutDemande(statut) {
  return STATUT_DEMANDE_LABELS[statut] || statut || '—';
}

export function statutDemandeVariant(statut) {
  const s = (statut || '').toUpperCase();
  if (s === 'FOURNIE' || s === 'VALIDEE') return 'success';
  if (s === 'EN_ATTENTE') return 'info';
  if (s === 'REFUSEE' || s === 'ANNULEE') return 'danger';
  return 'neutral';
}

export function computeMagasinierAggregates({ pieces = [], stocks = [], demandes = [], mouvements = [] }) {
  const stockByPiece = {};
  stocks.forEach((s) => {
    stockByPiece[s.id_piece] = s;
  });

  let rupture = 0;
  let stockFaible = 0;
  let disponibles = 0;
  let valeurStock = 0;

  pieces.forEach((p) => {
    const st = stockByPiece[p.id_piece];
    const qty = st?.quantite_disponible ?? 0;
    const seuil = st?.seuil_alerte ?? 1;
    const etat = getStockEtat(qty, seuil);
    if (etat.variant === 'danger') rupture += 1;
    else if (etat.variant === 'warning') stockFaible += 1;
    else disponibles += 1;
    valeurStock += (Number(p.prix_marche) || 0) * qty;
  });

  const demandesEnAttente = demandes.filter((d) => d.statut === 'EN_ATTENTE').length;
  const demandesFournies = demandes.filter((d) => d.statut === 'FOURNIE').length;

  const entrees24h = mouvements.filter((m) => m.type_mouvement === 'ENTREE').length;
  const sorties24h = mouvements.filter((m) => m.type_mouvement === 'SORTIE').length;

  return {
    totalPieces: pieces.length,
    disponibles,
    stockFaible,
    rupture,
    valeurStock,
    demandesEnAttente,
    demandesFournies,
    entrees24h,
    sorties24h,
  };
}
