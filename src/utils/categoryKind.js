import { normalizeCategoryName } from './inventoryCode';

/**
 * Normalise le nom de catégorie pour comparaison : sans accents, majuscules, espaces → _.
 * @param {string} nomCategorie
 * @returns {string}
 */
export function normalizeCategoryKey(nomCategorie) {
  return normalizeCategoryName(nomCategorie).replace(/\s+/g, '_').toUpperCase();
}

/**
 * Détecte le type métier de catégorie (véhicule, machine, ordinateur).
 * @param {string} nomCategorie - nom_categorie depuis le backend
 * @returns {'VEHICULE' | 'MACHINE' | 'ORDINATEUR' | null}
 */
export function getCategoryKind(nomCategorie) {
  const key = normalizeCategoryKey(nomCategorie);
  if (key === 'VEHICULE' || key === 'VEHICULES') return 'VEHICULE';
  if (key === 'MACHINE' || key === 'MACHINES') return 'MACHINE';
  if (key === 'ORDINATEUR' || key === 'ORDINATEURS') return 'ORDINATEUR';
  return null;
}

/** Titre de section pour les champs spécifiques du formulaire. */
export function getSpecificFieldsTitle(kind) {
  const titles = {
    VEHICULE: 'Informations spécifiques au véhicule',
    MACHINE: 'Informations spécifiques à la machine',
    ORDINATEUR: 'Informations spécifiques à l\'ordinateur',
  };
  return titles[kind] || null;
}

/**
 * Affiche le nombre d'immobilisations liées à une catégorie (pluriel français).
 * @param {number} count
 * @returns {string}
 */
export function formatImmoCountByCategory(count) {
  const n = Number(count) || 0;
  if (n === 0) return '0 immobilisation';
  if (n === 1) return '1 immobilisation';
  return `${n} immobilisations`;
}
