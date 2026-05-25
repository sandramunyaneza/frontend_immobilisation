import { useMemo, useState } from 'react';
import { AlertTriangle, TrendingUp } from 'lucide-react';
import useFetch from '../hooks/useFetch';
import { auditService } from '../services/audit';
import { utilisateursService } from '../services/utilisateurs';
import Header from '../components/layout/Header';
import PageHeader from '../components/ui/PageHeader';
import AlertBanner from '../components/ui/AlertBanner';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import AuditCard from '../components/admin/AuditCard';
import { computeAuditDistribution, filterAuditLogs } from '../utils/audit';

function FilterSelect({ label, value, onChange, children }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-500">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/30"
      >
        {children}
      </select>
    </div>
  );
}

function ProgressBar({ label, percent, color }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="text-slate-500">{percent}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

export default function AuditPage() {
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');

  const { data: logs, loading, error, setError } = useFetch(() => auditService.list(), []);
  const { data: users } = useFetch(() => utilisateursService.list().catch(() => []), []);

  const usersMap = useMemo(() => {
    const m = {};
    users.forEach((u) => {
      m[u.id_user] = u.nom;
    });
    return m;
  }, [users]);

  const modules = useMemo(() => {
    const set = new Set(logs.map((l) => l.entite_concernee).filter(Boolean));
    return [...set].sort();
  }, [logs]);

  const filtered = useMemo(
    () =>
      filterAuditLogs(logs, {
        search,
        module: moduleFilter || undefined,
        userId: userFilter || undefined,
      }),
    [logs, search, moduleFilter, userFilter]
  );

  const dist = useMemo(() => computeAuditDistribution(logs), [logs]);

  const todayCount = useMemo(() => {
    const today = new Date().toDateString();
    return logs.filter((l) => l.date_action && new Date(l.date_action).toDateString() === today).length;
  }, [logs]);

  return (
    <>
      <Header
        search={search}
        onSearch={setSearch}
        placeholder="Rechercher une action, un utilisateur ou un ID..."
      />
      <div className="flex-1 p-6">
        <PageHeader
          title="Journal d'audit"
          description="Suivi chronologique de l'activité du système et des modifications d'actifs."
        />
        <AlertBanner message={error} onClose={() => setError(null)} />

        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <FilterSelect label="Module" value={moduleFilter} onChange={setModuleFilter}>
            <option value="">Tous les modules</option>
            {modules.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect label="Utilisateur" value={userFilter} onChange={setUserFilter}>
            <option value="">Tous les responsables</option>
            {users.map((u) => (
              <option key={u.id_user} value={u.id_user}>
                {u.nom}
              </option>
            ))}
          </FilterSelect>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[1fr_300px]">
            <div>
              {filtered.length === 0 ? (
                <EmptyState title="Aucune entrée d'audit" />
              ) : (
                <div className="space-y-3">
                  {filtered.map((entry) => (
                    <AuditCard
                      key={entry.id_log}
                      entry={entry}
                      userName={usersMap[entry.id_utilisateur]}
                    />
                  ))}
                </div>
              )}
              {filtered.length > 0 && (
                <p className="mt-4 text-xs text-slate-500">
                  Affichage de {filtered.length} sur {logs.length} entrée{logs.length > 1 ? 's' : ''}
                </p>
              )}
            </div>

            <aside className="space-y-4">
              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <h2 className="text-sm font-bold text-slate-900">Résumé de l&apos;activité</h2>
                <div className="mt-4">
                  <p className="text-xs text-slate-500">Actions aujourd&apos;hui</p>
                  <div className="mt-1 flex items-end gap-2">
                    <span className="text-3xl font-bold text-slate-900">{todayCount}</span>
                    {logs.length > 0 && (
                      <span className="mb-1 flex items-center text-xs font-medium text-emerald-600">
                        <TrendingUp className="mr-0.5 h-3 w-3" />
                        {logs.length} total
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {dist.criticalDeletes > 0 && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 shrink-0 text-red-600" />
                    <div>
                      <p className="text-xs font-semibold uppercase text-red-700">Alertes critiques</p>
                      <p className="mt-1 text-sm text-red-800">
                        {dist.criticalDeletes} suppression{dist.criticalDeletes > 1 ? 's' : ''} — vérification recommandée
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {logs.length > 0 && (
                <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Répartition</p>
                  <div className="mt-4 space-y-3">
                    <ProgressBar label="Modifications" percent={dist.modifications} color="bg-slate-800" />
                    <ProgressBar label="Créations" percent={dist.creations} color="bg-blue-500" />
                    <ProgressBar label="Suppressions" percent={dist.suppressions} color="bg-red-500" />
                  </div>
                </div>
              )}
            </aside>
          </div>
        )}
      </div>
    </>
  );
}
