import {
  AlertTriangle,
  ArrowLeftRight,
  Boxes,
  Building2,
  Cog,
  FileText,
  FolderTree,
  Gavel,
  Hammer,
  Key,
  LayoutDashboard,
  LogOut,
  Package,
  ScrollText,
  Shield,
  TrendingDown,
  Users,
  Wrench,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getMenuForRole } from '../../utils/menu';

const ICONS = {
  LayoutDashboard,
  Users,
  Shield,
  Key,
  ScrollText,
  FolderTree,
  Building2,
  TrendingDown,
  FileText,
  AlertTriangle,
  Wrench,
  Hammer,
  Package,
  Cog,
  Boxes,
  ArrowLeftRight,
  Gavel,
};

function initials(nom) {
  if (!nom) return '?';
  return nom
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function Sidebar() {
  const { user, role, logout } = useAuth();
  const items = getMenuForRole(role);

  return (
    <aside className="flex w-[260px] shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-100 px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-base font-bold tracking-tight text-slate-900">ImmoManager</p>
            <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
              {role === 'COMPTABLE'
                ? 'Gestion comptable'
                : role === 'MAGASINIER'
                  ? 'Gestion du stock'
                  : role === 'DIRECTEUR_GENERAL'
                    ? 'Pilotage stratégique'
                    : role === 'TECHNICIEN'
                      ? 'Suivi technique'
                      : 'Gestion immobilisations'}
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 p-3">
        {items.map(({ to, label, icon }) => {
          const Icon = ICONS[icon] || LayoutDashboard;
          return (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r bg-blue-600" />
                  )}
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-slate-100 p-4">
        <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
            {initials(user?.nom)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900">{user?.nom || '—'}</p>
            <p className="truncate text-xs text-slate-500">{user?.email}</p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-white hover:text-slate-900"
            title="Déconnexion"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
