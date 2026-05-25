/**
 * Calculs d'amortissement comptable (linéaire, dégressif, par composant).
 * Les formules suivent les règles métier du module Comptable.
 */

const roundMoney = (n) => Math.round(Number(n) * 100) / 100;

/** Coefficient dégressif selon la durée de vie du bien. */
export function getDegressifCoefficient(dureeVie) {
  const d = Number(dureeVie);
  if (d >= 3 && d <= 4) return 1.5;
  if (d >= 5 && d <= 6) return 2;
  if (d > 6) return 2.5;
  return 1.5;
}

/**
 * Dernier amortissement enregistré pour un bien avant l'exercice en cours.
 * @param {Array} amortissements
 * @param {number} idImmobilisation
 * @param {number} exercice
 */
export function getPreviousAmortissement(amortissements, idImmobilisation, exercice) {
  const prev = amortissements
    .filter(
      (a) =>
        a.id_immobilisation === idImmobilisation &&
        Number(a.exercice) < Number(exercice)
    )
    .sort((a, b) => Number(b.exercice) - Number(a.exercice));
  return prev[0] || null;
}

/** Vérifie si un amortissement existe déjà pour le même bien et exercice. */
export function hasAmortissementForExercice(amortissements, idImmobilisation, exercice) {
  return amortissements.some(
    (a) =>
      a.id_immobilisation === idImmobilisation &&
      Number(a.exercice) === Number(exercice)
  );
}

/**
 * Applique cumul et VNC avec plafonds (cumul ≤ valeur d'achat, VNC ≥ 0).
 */
function finalizeAmounts(valeurAchat, cumulPrecedent, montantAnnuel) {
  const va = Number(valeurAchat);
  const cp = Number(cumulPrecedent) || 0;
  const vncRestante = Math.max(va - cp, 0);
  let dotation = roundMoney(Math.min(montantAnnuel, vncRestante));
  if (dotation < 0) dotation = 0;

  let cumul = roundMoney(cp + dotation);
  if (cumul > va) {
    cumul = roundMoney(va);
    dotation = roundMoney(va - cp);
  }

  const valeurNette = roundMoney(Math.max(va - cumul, 0));
  return { montant_annuel: dotation, cumul, valeur_nette: valeurNette };
}

/**
 * Amortissement linéaire : dotation constante = valeur_achat / duree_vie.
 */
export function calculateLineaire({ valeurAchat, dureeVie, cumulPrecedent = 0 }) {
  const va = Number(valeurAchat);
  const dv = Number(dureeVie);
  if (!dv || dv <= 0) {
    return { montant_annuel: 0, cumul: cumulPrecedent, valeur_nette: va, taux: 0 };
  }

  const taux = roundMoney(100 / dv);
  const montantBrut = va / dv;
  const amounts = finalizeAmounts(va, cumulPrecedent, montantBrut);
  return { ...amounts, taux };
}

/**
 * Amortissement dégressif : base = VNC précédente (ou valeur d'achat en année 1).
 */
export function calculateDegressif({
  valeurAchat,
  dureeVie,
  cumulPrecedent = 0,
  valeurNettePrecedente,
}) {
  const va = Number(valeurAchat);
  const dv = Number(dureeVie);
  if (!dv || dv <= 0) {
    return { montant_annuel: 0, cumul: cumulPrecedent, valeur_nette: va, taux: 0 };
  }

  const tauxLineaire = 100 / dv;
  const coefficient = getDegressifCoefficient(dv);
  const tauxDegressif = roundMoney(tauxLineaire * coefficient);

  const base =
    valeurNettePrecedente != null && cumulPrecedent > 0
      ? Number(valeurNettePrecedente)
      : va;

  const montantBrut = (base * tauxDegressif) / 100;
  const amounts = finalizeAmounts(va, cumulPrecedent, montantBrut);
  return { ...amounts, taux: tauxDegressif };
}

/**
 * Amortissement par composant : somme des dotations de chaque composant.
 * @param {Array<{ valeur_composant: number|string, duree_vie_composant: number|string }>} composants
 */
export function calculateParComposant({ valeurAchat, composants, cumulPrecedent = 0 }) {
  const va = Number(valeurAchat);
  let montantBrut = 0;

  for (const c of composants) {
    const val = Number(c.valeur_composant);
    const dv = Number(c.duree_vie_composant);
    if (val > 0 && dv > 0) {
      montantBrut += val / dv;
    }
  }

  montantBrut = roundMoney(montantBrut);
  const amounts = finalizeAmounts(va, cumulPrecedent, montantBrut);
  const taux = va > 0 ? roundMoney((amounts.montant_annuel / va) * 100) : 0;
  return { ...amounts, taux };
}

/**
 * Calcule montant_annuel, cumul, valeur_nette et taux selon la méthode.
 */
export function computeAmortissement({
  methode,
  immobilisation,
  exercice,
  amortissements,
  composants = [],
}) {
  if (!immobilisation) {
    return null;
  }

  const va = Number(immobilisation.valeur_achat);
  const dv = Number(immobilisation.duree_vie);
  const idImmo = immobilisation.id_immobilisation;
  const prev = getPreviousAmortissement(amortissements, idImmo, exercice);
  const cumulPrecedent = prev ? Number(prev.cumul) : 0;
  const vncPrecedente = prev ? Number(prev.valeur_nette) : null;

  if (methode === 'LINEAIRE') {
    return calculateLineaire({ valeurAchat: va, dureeVie: dv, cumulPrecedent });
  }

  if (methode === 'DEGRESSIF') {
    return calculateDegressif({
      valeurAchat: va,
      dureeVie: dv,
      cumulPrecedent,
      valeurNettePrecedente: vncPrecedente,
    });
  }

  if (methode === 'PAR_COMPOSANT') {
    return calculateParComposant({
      valeurAchat: va,
      composants,
      cumulPrecedent,
    });
  }

  return null;
}

/** Total des valeurs des composants saisis. */
export function sumComposantValues(composants) {
  return composants.reduce((sum, c) => sum + (Number(c.valeur_composant) || 0), 0);
}

/**
 * Valide le formulaire avant envoi.
 * @returns {string|null} message d'erreur ou null si OK
 */
export function validateAmortissementForm({
  idImmobilisation,
  methode,
  exercice,
  dateCalcul,
  immobilisation,
  amortissements,
  composants,
}) {
  if (!idImmobilisation) return 'Veuillez sélectionner une immobilisation.';
  if (!methode) return 'Veuillez sélectionner une méthode.';
  if (!exercice) return "L'exercice est obligatoire.";
  if (!dateCalcul) return 'La date de calcul est obligatoire.';

  if (
    hasAmortissementForExercice(
      amortissements,
      Number(idImmobilisation),
      Number(exercice)
    )
  ) {
    return 'Un amortissement existe déjà pour cette immobilisation et cet exercice.';
  }

  if (!immobilisation) return 'Immobilisation introuvable.';
  if (!immobilisation.duree_vie || Number(immobilisation.duree_vie) <= 0) {
    return "La durée de vie de l'immobilisation est invalide.";
  }

  if (methode === 'PAR_COMPOSANT') {
    if (!composants.length) {
      return 'Ajoutez au moins un composant pour la méthode par composant.';
    }
    for (const c of composants) {
      if (!c.nom_composant?.trim()) {
        return 'Chaque composant doit avoir un nom.';
      }
      if (Number(c.valeur_composant) <= 0) {
        return 'Chaque composant doit avoir une valeur supérieure à 0.';
      }
      if (Number(c.duree_vie_composant) <= 0) {
        return 'Chaque composant doit avoir une durée de vie supérieure à 0.';
      }
    }
    const total = sumComposantValues(composants);
    if (total > Number(immobilisation.valeur_achat)) {
      return "Le total des composants ne peut pas dépasser la valeur d'achat de l'immobilisation.";
    }
  }

  return null;
}
