import { useMemo, useState } from 'react';
import { FileText } from 'lucide-react';
import useFetch from '../../hooks/useFetch';
import { rapportsService } from '../../services/rapports';
import Header from '../../components/layout/Header';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import DataTable from '../../components/ui/DataTable';
import AlertBanner from '../../components/ui/AlertBanner';
import EmptyState from '../../components/ui/EmptyState';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { formatDate, formatRapportType } from '../../utils/format';
import ExportPdfButton from '../../components/ui/ExportPdfButton';
import { exportsService } from '../../services/exports';

export default function DirecteurRapportsPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [selected, setSelected] = useState(null);

  const { data, loading, error, setError } = useFetch(() => rapportsService.list(), []);

  const types = useMemo(() => {
    const set = new Set(data.map((r) => r.type_rapport).filter(Boolean));
    return [...set].sort();
  }, [data]);

  const filtered = useMemo(() => {
    let list = data;
    if (typeFilter) list = list.filter((r) => r.type_rapport === typeFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.titre?.toLowerCase().includes(q) ||
          r.contenu?.toLowerCase().includes(q) ||
          formatRapportType(r.type_rapport).toLowerCase().includes(q)
      );
    }
    return list;
  }, [data, search, typeFilter]);

  const columns = [
    {
      key: 'titre',
      label: 'Titre',
      render: (r) => (
        <button
          type="button"
          onClick={() => setSelected(r)}
          className="text-left font-semibold text-slate-900 hover:text-blue-600"
        >
          {r.titre || formatRapportType(r.type_rapport)}
        </button>
      ),
    },
    {
      key: 'type_rapport',
      label: 'Type',
      render: (r) => <Badge variant="info">{formatRapportType(r.type_rapport)}</Badge>,
    },
    {
      key: 'date_generation',
      label: 'Date de génération',
      render: (r) => formatDate(r.date_generation),
    },
    {
      key: 'id_utilisateur',
      label: 'Auteur',
      render: (r) => (r.id_utilisateur ? `#${r.id_utilisateur}` : '—'),
    },
  ];

  return (
    <>
      <Header
        search={search}
        onSearch={setSearch}
        placeholder="Rechercher un rapport..."
        action={<ExportPdfButton onExport={exportsService.exportRapportGlobalPdf} />}
      />
      <div className="flex-1 p-6">
        <PageHeader
          title="Rapports"
          description="Rapports financiers, techniques, maintenance, amortissement et synthèses du parc."
        />
        <AlertBanner message={error} onClose={() => setError(null)} />

        {!loading && data.length > 0 && (
          <div className="mb-6 max-w-xs">
            <StatCard label="Rapports disponibles" value={data.length} icon={FileText} />
          </div>
        )}

        <div className="mb-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTypeFilter('')}
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${
              !typeFilter ? 'bg-slate-900 text-white' : 'bg-white ring-1 ring-slate-200'
            }`}
          >
            Tous
          </button>
          {types.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTypeFilter(t)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                typeFilter === t ? 'bg-slate-900 text-white' : 'bg-white ring-1 ring-slate-200'
              }`}
            >
              {formatRapportType(t)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState title={search ? 'Aucun rapport trouvé' : 'Aucun rapport généré'} />
        ) : (
          <DataTable
            columns={columns}
            data={filtered}
            rowKey="id_rapport"
            footer={`Affichage de ${filtered.length} sur ${data.length} rapport${data.length > 1 ? 's' : ''}`}
          />
        )}
      </div>

      <Modal
        open={!!selected}
        title={selected?.titre || formatRapportType(selected?.type_rapport)}
        onClose={() => setSelected(null)}
      >
        {selected && (
          <div className="space-y-3 text-sm">
            <p>
              <span className="text-slate-500">Type : </span>
              {formatRapportType(selected.type_rapport)}
            </p>
            <p>
              <span className="text-slate-500">Généré le : </span>
              {formatDate(selected.date_generation)}
            </p>
            <div className="rounded-lg bg-slate-50 p-4 text-slate-700">
              {selected.contenu || 'Aucun contenu détaillé pour ce rapport.'}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
