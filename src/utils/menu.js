/** Menu sidebar selon le rôle connecté */
export const MENU_BY_ROLE = {
  ADMINISTRATEUR: [
    { to: '/dashboard', label: 'Tableau de bord', icon: 'LayoutDashboard' },
    { to: '/utilisateurs', label: 'Utilisateurs', icon: 'Users' },
    { to: '/roles', label: 'Rôles', icon: 'Shield' },
    { to: '/permissions', label: 'Permissions', icon: 'Key' },
    { to: '/audit', label: 'Journal d\'audit', icon: 'ScrollText' },
  ],
  COMPTABLE: [
    { to: '/comptable/dashboard', label: 'Tableau de bord', icon: 'LayoutDashboard' },
    { to: '/comptable/categories-immobilisations', label: 'Catégories', icon: 'FolderTree' },
    { to: '/comptable/immobilisations', label: 'Immobilisations', icon: 'Building2' },
    { to: '/comptable/amortissements', label: 'Amortissements', icon: 'TrendingDown' },
    { to: '/comptable/rapports', label: 'Rapports financiers', icon: 'FileText' },
  ],
  TECHNICIEN: [
    { to: '/technicien/dashboard', label: 'Tableau de bord', icon: 'LayoutDashboard' },
    { to: '/technicien/pannes', label: 'Pannes', icon: 'AlertTriangle' },
    { to: '/technicien/maintenances', label: 'Maintenances', icon: 'Wrench' },
    { to: '/technicien/reparations', label: 'Réparations', icon: 'Hammer' },
    { to: '/technicien/demandes-pieces', label: 'Demandes de pièces', icon: 'Package' },
  ],
  MAGASINIER: [
    { to: '/magasinier/dashboard', label: 'Tableau de bord', icon: 'LayoutDashboard' },
    { to: '/magasinier/pieces', label: 'Pièces de rechange', icon: 'Cog' },
    { to: '/magasinier/stock', label: 'Stock', icon: 'Boxes' },
    { to: '/magasinier/mouvements-stock', label: 'Mouvements de stock', icon: 'ArrowLeftRight' },
    { to: '/magasinier/demandes-pieces', label: 'Demandes de pièces', icon: 'Package' },
  ],
  DIRECTEUR_GENERAL: [
    { to: '/directeur-general/dashboard', label: 'Tableau de bord', icon: 'LayoutDashboard' },
    { to: '/directeur-general/rapports', label: 'Rapports', icon: 'FileText' },
    { to: '/directeur-general/decisions', label: 'Décisions', icon: 'Gavel' },
    { to: '/directeur-general/audit', label: 'Journal d\'audit', icon: 'ScrollText' },
  ],
};

export function getMenuForRole(role) {
  return MENU_BY_ROLE[role] || MENU_BY_ROLE.ADMINISTRATEUR;
}
