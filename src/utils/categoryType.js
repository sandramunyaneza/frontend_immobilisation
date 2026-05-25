import { normalizeCategoryName } from './inventoryCode';

/**
 * Correspondance nom de catégorie (backend) → type_immobilisation attendu par l'API.
 * Le type n'est pas saisi par l'utilisateur : il est déduit de la catégorie.
 */
const CATEGORY_TO_TYPE = {
  ordinateur: 'ORDINATEUR',
  vehicule: 'VEHICULE',
  machine: 'MACHINE',
  mobilier: 'AUTRE',
  'materiel technique': 'AUTRE',
  materiel_technique: 'AUTRE',
  autre: 'AUTRE',
};

/**
 * Déduit type_immobilisation à partir du nom de catégorie (GET /api/categories-immobilisations).
 * Valeur par défaut : AUTRE (contrainte backend).
 *
 * @param {string} nomCategorie
 * @returns {'VEHICULE' | 'MACHINE' | 'ORDINATEUR' | 'AUTRE'}
 */
export function deriveTypeImmobilisationFromCategory(nomCategorie) {
  const normalized = normalizeCategoryName(nomCategorie);
  const underscored = normalized.replace(/\s+/g, '_');
  return (
    CATEGORY_TO_TYPE[normalized] ||
    CATEGORY_TO_TYPE[underscored] ||
    'AUTRE'
  );
}
