import { useMemo, useState } from 'react';
import { FileText, Plus } from 'lucide-react';
import useFetch from '../../hooks/useFetch';
import { rapportsService } from '../../services/rapports';
import Header from '../../components/layout/Header';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import DataTable from '../../components/ui/DataTable';
import AlertBanner from '../../components/ui/AlertBanner';
import EmptyState from '../../components/ui/EmptyState';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import { FormField, inputClass } from '../../components/ui/FormCard';
import { formatDate, formatRapportType, isRapportComptable } from '../../utils/format';
import ExportPdfButton from '../../components/ui/ExportPdfButton';
import { exportsService } from '../../services/exports';

const TYPES_COMPTABLE = [
  { value: 'FINANCIER', label: 'Rapport financier' },
  { value: 'AMORTISSEMENT', label: "Rapport d'amortissement" },
];

const emptyForm = { type_rapport: 'FINANCIER', titre: '', contenu: '' };

export default function ComptableRapportsPage() {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const { data, loading, error, setError, reload } = useFetch(() => rapportsService.list(), []);

  const comptableRapports = useMemo(() => data.filter(isRapportComptable), [data]);

  const filtered = useMemo(() => {
    const base = comptableRapports;
    if (!search) return base;
    const q = search.toLowerCase();
    return base.filter(
      (r) =>
        r.titre?.toLowerCase().includes(q) ||
        r.type_rapport?.toLowerCase().includes(q) ||
        r.contenu?.toLowerCase().includes(q)
    );
  }, [comptableRapports, search]);

  const columns = [
    {
      key: 'titre',
      label: 'Rapport',
      render: (r) => (
        <div>
          <p className="font-semibold text-slate-900">{r.titre || formatRapportType(r.type_rapport)}</p>
          <p className="text-xs text-slate-500">{formatRapportType(r.type_rapport)}</p>
        </div>
      ),
    },
    {
      key: 'type_rapport',
      label: 'Type',
      render: (r) => <Badge variant="info">{formatRapportType(r.type_rapport)}</Badge>,
    },
    {
      key: 'date_generation',
      label: 'Dernière génération',
      render: (r) => formatDate(r.date_generation),
    },
    {
      key: 'contenu',
      label: 'Synthèse',
      render: (r) => (
        <span className="line-clamp-2 max-w-xs text-slate-600">{r.contenu || '—'}</span>
      ),
    },
  ];

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await rapportsService.create({
        type_rapport: form.type_rapport,
        titre: form.titre || null,
        contenu: form.contenu || null,
      });
      setOpen(false);
      setForm(emptyForm);
      reload();
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors de la création');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Header
        search={search}
        onSearch={setSearch}
        placeholder="Rechercher un rapport..."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <ExportPdfButton onExport={exportsService.exportRapportGlobalPdf} />
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" /> Nouveau rapport
            </button>
          </div>
        }
      />
      <div className="flex-1 p-6">
        <PageHeader
          title="Rapports financiers"
          description="Exports et synthèses comptables : amortissements, valeur nette et immobilisations."
        />
        <AlertBanner message={error} onClose={() => setError(null)} />

        {!loading && (
          <div className="mb-6 max-w-xs">
            <StatCard
              label="Rapports financiers disponibles"
              value={comptableRapports.length}
              icon={FileText}
            />
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title={
              search
                ? 'Aucun rapport trouvé'
                : 'Aucun rapport financier — les rapports de type Financier ou Amortissement apparaîtront ici'
            }
          />
        ) : (
          <DataTable
            columns={columns}
            data={filtered}
            rowKey="id_rapport"
            footer={`Affichage de ${filtered.length} sur ${comptableRapports.length} rapport${comptableRapports.length > 1 ? 's' : ''} comptable${comptableRapports.length > 1 ? 's' : ''}`}
          />
        )}
      </div>

      <Modal open={open} title="Nouveau rapport financier" onClose={() => setOpen(false)}>
        <form onSubmit={handleCreate} className="space-y-4">
          <FormField label="Type de rapport">
            <select
              className={inputClass}
              value={form.type_rapport}
              onChange={(e) => setForm({ ...form, type_rapport: e.target.value })}
            >
              {TYPES_COMPTABLE.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Titre">
            <input
              className={inputClass}
              value={form.titre}
              onChange={(e) => setForm({ ...form, titre: e.target.value })}
              placeholder="Synthèse comptable, VNC globale..."
            />
          </FormField>
          <FormField label="Contenu / synthèse">
            <textarea
              className={inputClass}
              rows={4}
              value={form.contenu}
              onChange={(e) => setForm({ ...form, contenu: e.target.value })}
            />
          </FormField>
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-slate-900 py-2.5 text-sm font-medium text-white disabled:opacity-60"
          >
            Créer le rapport
          </button>
        </form>
      </Modal>
    </>
  );
}
