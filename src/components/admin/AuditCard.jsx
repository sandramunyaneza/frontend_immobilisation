import { FileEdit, Plus, Trash2, RotateCcw, Activity } from 'lucide-react';

const ACTION_STYLES = [
  { match: /suppr|delete|retir/i, border: 'border-l-red-500', iconBg: 'bg-red-100 text-red-600', Icon: Trash2 },
  { match: /creer|create|ajout/i, border: 'border-l-emerald-500', iconBg: 'bg-emerald-100 text-emerald-600', Icon: Plus },
  { match: /reset|reinit/i, border: 'border-l-orange-500', iconBg: 'bg-orange-100 text-orange-600', Icon: RotateCcw },
  { match: /modif|update|edit/i, border: 'border-l-blue-500', iconBg: 'bg-blue-100 text-blue-600', Icon: FileEdit },
];

function getStyle(action) {
  const a = action || '';
  return ACTION_STYLES.find((s) => s.match.test(a)) || {
    border: 'border-l-slate-400',
    iconBg: 'bg-slate-100 text-slate-600',
    Icon: Activity,
  };
}

function formatTime(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const time = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  if (isToday) return `${time} AUJ.`;
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

export default function AuditCard({ entry, userName }) {
  const { border, iconBg, Icon } = getStyle(entry.action);
  const entityId = entry.id_entite_concernee ? `#${entry.id_entite_concernee}` : '—';

  return (
    <article
      className={`flex items-center gap-4 rounded-xl border border-slate-100 border-l-4 bg-white p-4 shadow-sm ${border}`}
    >
      <div className="w-16 shrink-0 text-center text-xs font-medium text-slate-400">
        {formatTime(entry.date_action)}
      </div>
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${iconBg}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-slate-900">{entry.action}</p>
        <p className="mt-0.5 truncate text-sm text-slate-500">{entry.description || '—'}</p>
      </div>
      <div className="hidden shrink-0 text-right text-xs text-slate-400 sm:block">
        {userName && <p className="font-medium text-slate-600">{userName}</p>}
        <p>ID: {entityId}</p>
        <p>Module: {entry.entite_concernee || '—'}</p>
        {entry.adresse_ip && <p className="mt-0.5">IP: {entry.adresse_ip}</p>}
      </div>
    </article>
  );
}
