import { useMemo, useState } from 'react';
import useFetch from '../../hooks/useFetch';
import { auditService } from '../../services/audit';
import Header from '../../components/layout/Header';
import PageHeader from '../../components/ui/PageHeader';
import AlertBanner from '../../components/ui/AlertBanner';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import AuditCard from '../../components/admin/AuditCard';
import { filterAuditLogs, computeAuditDistribution } from '../../utils/audit';
import ExportPdfButton from '../../components/ui/ExportPdfButton';
import { exportsService } from '../../services/exports';

export default function DirecteurAuditPage() {
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');

  const { data: logs, loading, error, setError } = useFetch(() => auditService.list(), []);

  const modules = useMemo(() => {
    const set = new Set(logs.map((l) => l.entite_concernee).filter(Boolean));
    return [...set].sort();
  }, [logs]);

  const filtered = useMemo(
    () =>
      filterAuditLogs(logs, {
        search,
        module: moduleFilter || undefined,
      }),
    [logs, search, moduleFilter]
  );

  const dist = useMemo(() => computeAuditDistribution(logs), [logs]);

  return (
    <>
      <Header
        search={search}
        onSearch={setSearch}
        placeholder="Rechercher une action, un utilisateur ou un ID..."
        action={<ExportPdfButton onExport={exportsService.exportAuditPdf} />}
      />
      <div className="flex-1 p-6">
        <PageHeader
          title="Journal d'audit"
          description="Consultation en lecture seule des actions importantes du système."
        />
        <AlertBanner message={error} onClose={() => setError(null)} />

        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Module</label>
            <select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              className="w-full max-w-xs rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              <option value="">Tous les modules</option>
              {modules.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[1fr_280px]">
            <div>
              {filtered.length === 0 ? (
                <EmptyState title="Aucune entrée d'audit" />
              ) : (
                <div className="space-y-3">
                  {filtered.map((entry) => (
                    <AuditCard key={entry.id_log} entry={entry} />
                  ))}
                </div>
              )}
              {filtered.length > 0 && (
                <p className="mt-4 text-xs text-slate-500">
                  Affichage de {filtered.length} sur {logs.length} entrée{logs.length > 1 ? 's' : ''}
                </p>
              )}
            </div>

            {logs.length > 0 && (
              <aside className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Répartition
                </p>
                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span>Modifications</span>
                    <span className="font-medium">{dist.modifications}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Créations</span>
                    <span className="font-medium">{dist.creations}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Suppressions</span>
                    <span className="font-medium text-red-600">{dist.suppressions}%</span>
                  </div>
                </div>
              </aside>
            )}
          </div>
        )}
      </div>
    </>
  );
}
