import { useMemo, useState } from 'react';
import { Key } from 'lucide-react';
import useFetch from '../hooks/useFetch';
import { permissionsService } from '../services/permissions';
import Header from '../components/layout/Header';
import PageHeader from '../components/ui/PageHeader';
import AlertBanner from '../components/ui/AlertBanner';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import StatCard from '../components/ui/StatCard';

export default function PermissionsPage() {
  const [search, setSearch] = useState('');
  const { data, loading, error, setError } = useFetch(() => permissionsService.list(), []);

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(
      (p) =>
        p.code_permission?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
    );
  }, [data, search]);

  return (
    <>
      <Header search={search} onSearch={setSearch} placeholder="Rechercher une permission..." />
      <div className="flex-1 p-6">
        <PageHeader
          title="Permissions"
          description="Liste des permissions disponibles pour contrôler l'accès aux modules du système."
        />
        <AlertBanner message={error} onClose={() => setError(null)} />

        {!loading && data.length > 0 && (
          <div className="mb-6 max-w-xs">
            <StatCard label="Permissions définies" value={data.length} icon={Key} />
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState title={search ? 'Aucune permission trouvée' : 'Aucune permission configurée'} />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <div
                key={p.id_permission}
                className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:border-slate-200"
              >
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <Key className="h-4 w-4" />
                </div>
                <p className="font-semibold text-slate-900">{p.code_permission}</p>
                <p className="mt-1 text-sm text-slate-500">{p.description || '—'}</p>
              </div>
            ))}
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <p className="mt-6 text-xs text-slate-500">
            Affichage de {filtered.length} sur {data.length} permission{data.length > 1 ? 's' : ''}
          </p>
        )}
      </div>
    </>
  );
}
