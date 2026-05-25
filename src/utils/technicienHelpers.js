const GRAVITE_LABELS = {
  FAIBLE: 'Faible',
  MOYENNE: 'Moyenne',
  ELEVEE: 'Élevée',
  CRITIQUE: 'Critique',
};

const STATUT_PANNE_LABELS = {
  DECLAREE: 'Déclarée',
  EN_COURS: 'En cours',
  RESOLUE: 'Résolue',
  ANNULEE: 'Annulée',
};

const TYPE_MAINTENANCE_LABELS = {
  PREVENTIVE: 'Préventive',
  CORRECTIVE: 'Corrective',
};

const STATUT_MAINTENANCE_LABELS = {
  PLANIFIEE: 'Planifiée',
  EN_COURS: 'En cours',
  TERMINEE: 'Terminée',
  ANNULEE: 'Annulée',
};

export function formatGravite(g) {
  return GRAVITE_LABELS[g] || g || '—';
}

export function graviteVariant(g) {
  const map = { FAIBLE: 'neutral', MOYENNE: 'info', ELEVEE: 'warning', CRITIQUE: 'danger' };
  return map[g] || 'neutral';
}

export function formatStatutPanne(s) {
  return STATUT_PANNE_LABELS[s] || s || '—';
}

export function statutPanneVariant(s) {
  const map = {
    DECLAREE: 'warning',
    EN_COURS: 'info',
    RESOLUE: 'success',
    ANNULEE: 'neutral',
  };
  return map[s] || 'neutral';
}

export function formatTypeMaintenance(t) {
  return TYPE_MAINTENANCE_LABELS[t] || t || '—';
}

export function formatStatutMaintenance(s) {
  return STATUT_MAINTENANCE_LABELS[s] || s || '—';
}

export function statutMaintenanceVariant(s) {
  const map = {
    PLANIFIEE: 'info',
    EN_COURS: 'warning',
    TERMINEE: 'success',
    ANNULEE: 'neutral',
  };
  return map[s] || 'neutral';
}

export function computeTechnicienAggregates({
  stats,
  pannes = [],
  maintenances = [],
  reparations = [],
  demandes = [],
  immobilisations = [],
}) {
  const pannesDeclarees = pannes.filter((p) => p.statut === 'DECLAREE').length;
  const pannesEnCours = pannes.filter((p) => p.statut === 'EN_COURS').length;
  const pannesResolues = pannes.filter((p) => p.statut === 'RESOLUE').length;

  const maintPlanifiees = maintenances.filter((m) => m.statut === 'PLANIFIEE').length;
  const maintEnCours = maintenances.filter((m) => m.statut === 'EN_COURS').length;
  const maintTerminees = maintenances.filter((m) => m.statut === 'TERMINEE').length;

  const equipementsMaintenance = immobilisations.filter((i) => i.statut === 'EN_MAINTENANCE').length;
  const equipementsHorsService = immobilisations.filter((i) => i.statut === 'HORS_SERVICE').length;

  const prochainesPreventives = maintenances
    .filter((m) => m.type_maintenance === 'PREVENTIVE' && m.statut === 'PLANIFIEE')
    .sort((a, b) => new Date(a.date_planifiee) - new Date(b.date_planifiee))
    .slice(0, 5);

  return {
    pannesDeclarees: stats?.pannes_declarees ?? pannes.length,
    pannesEnCours,
    pannesResolues,
    maintPlanifiees,
    maintEnCours: stats?.maintenances_en_cours ?? maintEnCours,
    maintTerminees,
    reparationsCount: reparations.length,
    demandesEnAttente:
      stats?.demandes_pieces_en_attente ??
      demandes.filter((d) => d.statut === 'EN_ATTENTE').length,
    equipementsMaintenance,
    equipementsHorsService,
    prochainesPreventives,
  };
}
