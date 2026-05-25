/**
 * Génération automatique du code inventaire.
 *
 * Format : PREFIXE_CATEGORIE-ANNEE_ACQUISITION-NUMERO_INCREMENTAL
 * Exemple : ORD-2026-005
 *
 * Si le backend gère déjà cette logique, passer BACKEND_GENERATES_INVENTORY_CODE à true
 * et ne pas appeler generateCodeInventaire côté frontend.
 */
export const BACKEND_GENERATES_INVENTORY_CODE = false;

/** Préfixes connus pour les catégories standards (clé = nom normalisé sans accents). */
const CATEGORY_PREFIX_MAP = {
  ordinateur: 'ORD',
  vehicule: 'VEH',
  machine: 'MACH',
  mobilier: 'MOB',
  'materiel technique': 'MAT',
  autre: 'AUT',
};

/** Motif d'un code inventaire valide : PREFIX-YYYY-NNN */
const INVENTORY_CODE_REGEX = /^([A-Z]+)-(\d{4})-(\d{3})$/;

/**
 * Normalise un libellé de catégorie pour la comparaison (minuscules, sans accents).
 * @param {string} name
 * @returns {string}
 */
export function normalizeCategoryName(name) {
  return String(name || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Retourne le préfixe inventaire associé à une catégorie.
 * Catégories reconnues → préfixe fixe ; sinon → 3 premières lettres en majuscules.
 *
 * @param {string} nomCategorie - Nom de la catégorie (depuis le backend)
 * @returns {string}
 */
export function getCategoryPrefix(nomCategorie) {
  if (!nomCategorie) return 'XXX';

  const normalized = normalizeCategoryName(nomCategorie);
  if (CATEGORY_PREFIX_MAP[normalized]) {
    return CATEGORY_PREFIX_MAP[normalized];
  }

  const letters = nomCategorie.replace(/[^a-zA-ZàâäéèêëïîôùûüçÀÂÄÉÈÊËÏÎÔÙÛÜÇ]/gi, '');
  const prefix = letters.slice(0, 3).toUpperCase();
  return prefix || 'XXX';
}

/**
 * Extrait l'année d'acquisition (AAAA) depuis une date ISO ou similaire.
 * @param {string} dateStr
 * @returns {string}
 */
function extractAcquisitionYear(dateStr) {
  if (!dateStr) return String(new Date().getFullYear());
  const isoYear = String(dateStr).slice(0, 4);
  if (/^\d{4}$/.test(isoYear)) return isoYear;
  const parsed = new Date(dateStr);
  return Number.isNaN(parsed.getTime())
    ? String(new Date().getFullYear())
    : String(parsed.getFullYear());
}

/**
 * Formate un code inventaire complet.
 * @param {string} prefix
 * @param {string} year
 * @param {number} sequence
 * @returns {string}
 */
function formatInventoryCode(prefix, year, sequence) {
  return `${prefix}-${year}-${String(sequence).padStart(3, '0')}`;
}

/**
 * Trouve le numéro séquentiel le plus élevé déjà utilisé pour un préfixe et une année donnés.
 * @param {string} prefix
 * @param {string} year
 * @param {Array<{ code_inventaire?: string | null }>} existingImmobilisations
 * @returns {number}
 */
function getMaxSequenceForPrefixYear(prefix, year, existingImmobilisations) {
  let maxSeq = 0;
  const base = `${prefix}-${year}-`;

  for (const im of existingImmobilisations) {
    const code = im?.code_inventaire;
    if (!code || !code.startsWith(base)) continue;

    const match = code.match(INVENTORY_CODE_REGEX);
    if (match && match[1] === prefix && match[2] === year) {
      maxSeq = Math.max(maxSeq, parseInt(match[3], 10));
    }
  }

  return maxSeq;
}

/**
 * Génère un code inventaire unique à partir de la catégorie, de la date d'acquisition
 * et des immobilisations déjà enregistrées (données backend).
 *
 * @param {Object} params
 * @param {string} params.categoryName - nom_categorie de la catégorie sélectionnée
 * @param {string} params.acquisitionDate - date_acquisition (YYYY-MM-DD)
 * @param {Array<{ code_inventaire?: string | null }>} [params.existingImmobilisations]
 * @returns {string | null} Code généré, ou null si le backend gère la génération
 */
export function generateCodeInventaire({
  categoryName,
  acquisitionDate,
  existingImmobilisations = [],
}) {
  if (BACKEND_GENERATES_INVENTORY_CODE) return null;

  const prefix = getCategoryPrefix(categoryName);
  const year = extractAcquisitionYear(acquisitionDate);
  let sequence = getMaxSequenceForPrefixYear(prefix, year, existingImmobilisations) + 1;

  const existingCodes = new Set(
    existingImmobilisations
      .map((im) => im?.code_inventaire)
      .filter((code) => typeof code === 'string' && code.length > 0)
  );

  let code = formatInventoryCode(prefix, year, sequence);
  while (existingCodes.has(code)) {
    sequence += 1;
    code = formatInventoryCode(prefix, year, sequence);
  }

  return code;
}

/** Alias anglais pour la même fonction. */
export const generateInventoryCode = generateCodeInventaire;
