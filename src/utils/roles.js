export const ROLES = {
  ADMIN: 'ADMINISTRATEUR',
  COMPTABLE: 'COMPTABLE',
  MAGASINIER: 'MAGASINIER',
  DIRECTEUR: 'DIRECTEUR_GENERAL',
  TECHNICIEN: 'TECHNICIEN',
};

export function getHomePathForRole(role) {
  if (role === ROLES.COMPTABLE) return '/comptable/dashboard';
  if (role === ROLES.MAGASINIER) return '/magasinier/dashboard';
  if (role === ROLES.DIRECTEUR) return '/directeur-general/dashboard';
  if (role === ROLES.TECHNICIEN) return '/technicien/dashboard';
  return '/dashboard';
}
