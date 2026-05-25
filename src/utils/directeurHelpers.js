const TYPE_DECISION_LABELS = {
  REMPLACEMENT_BIEN: 'Remplacement de bien',
  VALIDATION_BUDGET: 'Validation de budget',
  REFUS_BUDGET: 'Refus de budget',
  MISE_HORS_SERVICE: 'Mise hors service',
};

const STATUT_DECISION_LABELS = {
  EN_ATTENTE: 'En attente',
  APPROUVEE: 'Approuvée',
  REFUSEE: 'Refusée',
  EXECUTEE: 'Exécutée',
};

export function formatTypeDecision(type) {
  return TYPE_DECISION_LABELS[type] || type || '—';
}

export function formatStatutDecision(statut) {
  return STATUT_DECISION_LABELS[statut] || statut || '—';
}

export function statutDecisionVariant(statut) {
  const s = (statut || '').toUpperCase();
  if (s === 'APPROUVEE' || s === 'EXECUTEE') return 'success';
  if (s === 'EN_ATTENTE') return 'warning';
  if (s === 'REFUSEE') return 'danger';
  return 'neutral';
}

export function computeDirecteurAggregates({
  stats,
  immobilisations = [],
  maintenances = [],
  decisions = [],
}) {
  const valeurTotale = immobilisations.reduce(
    (sum, im) => sum + (Number(im.valeur_achat) || 0),
    0
  );

  const enMaintenance = immobilisations.filter((im) => im.statut === 'EN_MAINTENANCE').length;
  const horsService = immobilisations.filter(
    (im) => im.statut === 'HORS_SERVICE' || im.etat === 'HORS_SERVICE'
  ).length;

  const now = new Date();
  const prochesFinVie = immobilisations.filter((im) => {
    if (im.date_fin_vie) {
      const fin = new Date(im.date_fin_vie);
      const diff = (fin - now) / (1000 * 60 * 60 * 24);
      return diff >= 0 && diff <= 365;
    }
    if (im.date_acquisition && im.duree_vie) {
      const acq = new Date(im.date_acquisition);
      const finEstimee = new Date(acq);
      finEstimee.setFullYear(finEstimee.getFullYear() + Number(im.duree_vie));
      const diff = (finEstimee - now) / (1000 * 60 * 60 * 24);
      return diff >= 0 && diff <= 365;
    }
    return false;
  }).length;

  const coutMaintenances = maintenances.reduce(
    (sum, m) => sum + (Number(m.cout_prevu) || 0),
    0
  );

  const decisionsEnAttente = decisions.filter((d) => d.statut === 'EN_ATTENTE').length;
  const budgetsEnAttente = decisions.filter(
    (d) =>
      d.statut === 'EN_ATTENTE' &&
      (d.type_decision === 'VALIDATION_BUDGET' || d.type_decision === 'REFUS_BUDGET')
  ).length;

  return {
    totalImmobilisations: stats?.total_immobilisations ?? immobilisations.length,
    actives: stats?.immobilisations_actives ?? immobilisations.filter((i) => i.statut === 'ACTIF').length,
    enMaintenance,
    horsService,
    prochesFinVie,
    valeurTotale,
    coutMaintenances,
    maintenancesEnCours: stats?.maintenances_en_cours ?? maintenances.filter((m) =>
      ['PLANIFIEE', 'EN_COURS'].includes(m.statut)
    ).length,
    pannesOuvertes: stats?.pannes_declarees ?? 0,
    decisionsPrises: stats?.decisions_prises ?? decisions.length,
    decisionsEnAttente,
    budgetsEnAttente,
    alertesStock: stats?.pieces_stock_faible ?? 0,
  };
}
