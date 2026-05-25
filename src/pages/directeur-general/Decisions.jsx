import { useMemo, useState } from 'react';
import { Gavel, MoreVertical, Pencil, Plus } from 'lucide-react';
import useFetch from '../../hooks/useFetch';
import { decisionsService } from '../../services/decisions';
import { immobilisationsService } from '../../services/immobilisations';
import { maintenancesService } from '../../services/maintenances';
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
import { formatDollar, formatDate } from '../../utils/format';
import ExportPdfButton from '../../components/ui/ExportPdfButton';
import { exportsService } from '../../services/exports';
import {
  formatTypeDecision,
  formatStatutDecision,
  statutDecisionVariant,
} from '../../utils/directeurHelpers';

const TYPES = [
  { value: 'REMPLACEMENT_BIEN', label: 'Remplacement de bien' },
  { value: 'VALIDATION_BUDGET', label: 'Validation de budget' },
  { value: 'REFUS_BUDGET', label: 'Refus de budget' },
  { value: 'MISE_HORS_SERVICE', label: 'Mise hors service' },
];

const STATUTS = [
  { value: 'EN_ATTENTE', label: 'En attente' },
  { value: 'APPROUVEE', label: 'Approuvée' },
  { value: 'REFUSEE', label: 'Refusée' },
  { value: 'EXECUTEE', label: 'Exécutée' },
];

const emptyForm = {
  type_decision: 'VALIDATION_BUDGET',
  id_immobilisation: '',
  id_maintenance: '',
  motif: '',
  montant_valide: '',
  statut: 'EN_ATTENTE',
};

export default function DirecteurDecisionsPage() {
  const [search, setSearch] = useState('');
  const [statutFilter, setStatutFilter] = useState('');
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [menuOpen, setMenuOpen] = useState(null);
  const [saving, setSaving] = useState(false);

  const { data, loading, error, setError, reload } = useFetch(() => decisionsService.list(), []);
  const { data: immobilisations } = useFetch(() => immobilisationsService.list(), []);
  const { data: maintenances } = useFetch(() => maintenancesService.list(), []);

  const immoMap = useMemo(() => {
    const m = {};
    immobilisations.forEach((i) => {
      m[i.id_immobilisation] = i;
    });
    return m;
  }, [immobilisations]);

  const filtered = useMemo(() => {
    let list = data;
    if (statutFilter) list = list.filter((d) => d.statut === statutFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (d) =>
          formatTypeDecision(d.type_decision).toLowerCase().includes(q) ||
          d.motif?.toLowerCase().includes(q) ||
          d.statut?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [data, search, statutFilter]);

  const counts = useMemo(
    () => ({
      attente: data.filter((d) => d.statut === 'EN_ATTENTE').length,
      approuvee: data.filter((d) => d.statut === 'APPROUVEE').length,
      refusee: data.filter((d) => d.statut === 'REFUSEE').length,
    }),
    [data]
  );

  const openCreate = () => {
    setEditItem(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (d) => {
    setEditItem(d);
    setForm({
      type_decision: d.type_decision,
      id_immobilisation: d.id_immobilisation ? String(d.id_immobilisation) : '',
      id_maintenance: d.id_maintenance ? String(d.id_maintenance) : '',
      motif: d.motif || '',
      montant_valide: d.montant_valide != null ? String(d.montant_valide) : '',
      statut: d.statut,
    });
    setOpen(true);
    setMenuOpen(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      type_decision: form.type_decision,
      motif: form.motif || null,
      statut: form.statut,
      montant_valide: form.montant_valide ? Number(form.montant_valide) : null,
      id_immobilisation: form.id_immobilisation ? Number(form.id_immobilisation) : null,
      id_maintenance: form.id_maintenance ? Number(form.id_maintenance) : null,
    };
    try {
      if (editItem) {
        await decisionsService.update(editItem.id_decision, payload);
      } else {
        await decisionsService.create(payload);
      }
      setOpen(false);
      reload();
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      key: 'type_decision',
      label: 'Type',
      render: (r) => formatTypeDecision(r.type_decision),
    },
    {
      key: 'immo',
      label: 'Immobilisation',
      render: (r) =>
        r.id_immobilisation
          ? immoMap[r.id_immobilisation]?.nom || `#${r.id_immobilisation}`
          : '—',
    },
    {
      key: 'maintenance',
      label: 'Maintenance',
      render: (r) => (r.id_maintenance ? `#${r.id_maintenance}` : '—'),
    },
    {
      key: 'montant_valide',
      label: 'Montant validé ($)',
      render: (r) => formatDollar(r.montant_valide),
    },
    {
      key: 'statut',
      label: 'Statut',
      render: (r) => (
        <Badge variant={statutDecisionVariant(r.statut)} dot>
          {formatStatutDecision(r.statut)}
        </Badge>
      ),
    },
    { key: 'date_decision', label: 'Date', render: (r) => formatDate(r.date_decision) },
    {
      key: 'actions',
      label: '',
      render: (r) => (
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen(menuOpen === r.id_decision ? null : r.id_decision)}
            className="rounded p-1 hover:bg-slate-100"
          >
            <MoreVertical className="h-4 w-4 text-slate-500" />
          </button>
          {menuOpen === r.id_decision && (
            <button
              type="button"
              onClick={() => openEdit(r)}
              className="absolute right-0 z-10 flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm shadow-lg"
            >
              <Pencil className="h-3.5 w-3.5" /> Modifier
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <Header
        search={search}
        onSearch={setSearch}
        placeholder="Rechercher une décision..."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <ExportPdfButton onExport={exportsService.exportDecisionsPdf} />
            <button
              type="button"
              onClick={openCreate}
              className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" /> Nouvelle décision
            </button>
          </div>
        }
      />
      <div className="flex-1 p-6">
        <PageHeader
          title="Décisions"
          description="Validation de budgets, remplacements de biens et mises hors service."
        />
        <AlertBanner message={error} onClose={() => setError(null)} />

        {!loading && data.length > 0 && (
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <StatCard label="En attente" value={counts.attente} icon={Gavel} accent="amber" />
            <StatCard label="Approuvées" value={counts.approuvee} accent="emerald" />
            <StatCard label="Refusées" value={counts.refusee} accent="red" />
          </div>
        )}

        <div className="mb-4 flex flex-wrap gap-2">
          {['', ...STATUTS.map((s) => s.value)].map((s) => (
            <button
              key={s || 'all'}
              type="button"
              onClick={() => setStatutFilter(s)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                statutFilter === s ? 'bg-slate-900 text-white' : 'bg-white ring-1 ring-slate-200'
              }`}
            >
              {s ? formatStatutDecision(s) : 'Toutes'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState title="Aucune décision" />
        ) : (
          <DataTable
            columns={columns}
            data={filtered}
            rowKey="id_decision"
            footer={`Affichage de ${filtered.length} sur ${data.length} décision${data.length > 1 ? 's' : ''}`}
          />
        )}
      </div>

      <Modal
        open={open}
        title={editItem ? 'Modifier la décision' : 'Nouvelle décision'}
        onClose={() => setOpen(false)}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Type de décision">
            <select
              className={inputClass}
              value={form.type_decision}
              onChange={(e) => setForm({ ...form, type_decision: e.target.value })}
            >
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Immobilisation (optionnel)">
            <select
              className={inputClass}
              value={form.id_immobilisation}
              onChange={(e) => setForm({ ...form, id_immobilisation: e.target.value })}
            >
              <option value="">—</option>
              {immobilisations.map((im) => (
                <option key={im.id_immobilisation} value={im.id_immobilisation}>
                  {im.nom} ({im.code_inventaire || im.id_immobilisation})
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Maintenance (optionnel)">
            <select
              className={inputClass}
              value={form.id_maintenance}
              onChange={(e) => setForm({ ...form, id_maintenance: e.target.value })}
            >
              <option value="">—</option>
              {maintenances.map((m) => (
                <option key={m.id_maintenance} value={m.id_maintenance}>
                  Maintenance #{m.id_maintenance} — {formatDollar(m.cout_prevu)}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Montant validé ($)">
            <input
              type="number"
              step="0.01"
              min={0}
              className={inputClass}
              value={form.montant_valide}
              onChange={(e) => setForm({ ...form, montant_valide: e.target.value })}
            />
          </FormField>
          <FormField label="Motif">
            <textarea
              className={inputClass}
              rows={2}
              value={form.motif}
              onChange={(e) => setForm({ ...form, motif: e.target.value })}
            />
          </FormField>
          <FormField label="Statut">
            <select
              className={inputClass}
              value={form.statut}
              onChange={(e) => setForm({ ...form, statut: e.target.value })}
            >
              {STATUTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </FormField>
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-slate-900 py-2.5 text-sm font-medium text-white disabled:opacity-60"
          >
            {editItem ? 'Enregistrer' : 'Créer la décision'}
          </button>
        </form>
      </Modal>
    </>
  );
}
