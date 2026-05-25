/**
 * Agrégations comptables calculées côté frontend à partir des listes API.
 */
export function computeComptableAggregates({ immobilisations = [], amortissements = [], categories = [] }) {
  const valeurTotaleAcquisition = immobilisations.reduce(
    (sum, i) => sum + (Number(i.valeur_achat) || 0),
    0
  );

  const latestByImmo = {};
  for (const a of amortissements) {
    const id = a.id_immobilisation;
    if (!latestByImmo[id] || (a.exercice ?? 0) >= (latestByImmo[id].exercice ?? 0)) {
      latestByImmo[id] = a;
    }
  }

  const vncGlobale = immobilisations.reduce((sum, im) => {
    const last = latestByImmo[im.id_immobilisation];
    if (last?.valeur_nette != null) return sum + Number(last.valeur_nette);
    return sum + (Number(im.valeur_achat) || 0);
  }, 0);

  const amortissementCumule = amortissements.reduce((sum, a) => sum + (Number(a.cumul) || 0), 0);

  const totalementAmorties = Object.values(latestByImmo).filter(
    (a) => Number(a.valeur_nette) <= 0
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

  return {
    valeurTotaleAcquisition,
    vncGlobale,
    amortissementCumule,
    nbAmortissements: amortissements.length,
    totalementAmorties,
    prochesFinVie,
    nbCategories: categories.length,
  };
}
