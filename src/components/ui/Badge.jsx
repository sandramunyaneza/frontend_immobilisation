const VARIANTS = {
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  danger: 'bg-red-50 text-red-700 ring-red-600/20',
  warning: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  info: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  neutral: 'bg-slate-100 text-slate-700 ring-slate-500/20',
  navy: 'bg-slate-900 text-white ring-slate-900/20',
};

export default function Badge({ children, variant = 'neutral', dot = false, className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${VARIANTS[variant] || VARIANTS.neutral} ${className}`}
    >
      {dot && (
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            variant === 'success' ? 'bg-emerald-500' : variant === 'danger' ? 'bg-red-500' : 'bg-current'
          }`}
        />
      )}
      {children}
    </span>
  );
}

export function roleBadgeVariant(nomRole) {
  const r = (nomRole || '').toUpperCase();
  if (r.includes('ADMIN')) return 'navy';
  if (r.includes('COMPTABLE')) return 'info';
  if (r.includes('MANAGER') || r.includes('TECHNICIEN')) return 'warning';
  if (r.includes('MAGASINIER')) return 'neutral';
  if (r.includes('DIRECTEUR')) return 'navy';
  return 'neutral';
}

export function statutBadgeVariant(statut) {
  const s = (statut || '').toUpperCase();
  if (s === 'ACTIF') return 'success';
  if (s === 'INACTIF' || s === 'BLOQUE') return 'danger';
  return 'neutral';
}
