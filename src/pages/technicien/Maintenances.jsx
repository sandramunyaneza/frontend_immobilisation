import { useMemo, useState } from 'react';
import { Plus, Wrench } from 'lucide-react';
import useFetch from '../../hooks/useFetch';
import { useAuth } from '../../context/AuthContext';
import { maintenancesService } from '../../services/maintenances';
import { immobilisationsService } from '../../services/immobilisations';
import { pannesService } from '../../services/pannes';
import Header from '../../components/layout/Header';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import AlertBanner from '../../components/ui/AlertBanner';
import EmptyState from '../../components/ui/EmptyState';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import { FormField, inputClass } from '../../components/ui/FormCard';
import { formatDate, formatDollar } from '../../utils/format';
import ExportPdfButton from '../../components/ui/ExportPdfButton';
import { exportsService } from '../../services/exports';
import {
  formatStatutMaintenance,
  formatTypeMaintenance,
  statutMaintenanceVariant,
} from '../../utils/technicienHelpers';

const TYPES = ['PREVENTIVE', 'CORRECTIVE'];
const STATUTS = ['PLANIFIEE', 'EN_COURS', 'TERMINEE', 'ANNULEE'];

const defaultForm = {
  id_immobilisation: '',
  id_panne: '',
  date_planifiee: new Date().toISOString().slice(0, 10),
  type_maintenance: 'PREVENTIVE',
  cout_prevu: '0',
  observation: '',
  statut: 'PLANIFIEE',
};

export default function TechnicienMaintenancesPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

  const { data, loading, error, setError, reload } = useFetch(
    () => maintenancesService.list(),
    []
  );
  const { data: immobilisations } = useFetch(() => immobilisationsService.list(), []);
  const { data: pannes } = useFetch(() => pannesService.list(), []);

  const immoMap = useMemo(() => {
    const m = {};
    immobilisations.forEach((i) => {
      m[i.id_immobilisation] = i;
    });
    return m;
  }, [immobilisations]);

  const panneMap = useMemo(() => {
    const m = {};
    pannes.forEach((p) => {
      m[p.id_panne] = p;
    });
    return m;
  }, [pannes]);

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter((m) => {
      const im = immoMap[m.id_immobilisation];
      return (
        im?.nom?.toLowerCase().includes(q) ||
        m.type_maintenance?.toLowerCase().includes(q) ||
        m.statut?.toLowerCase().includes(q)
      );
    });
  }, [data, search, immoMap]);

  const pannesForImmo = useMemo(() => {
    if (!form.id_immobilisation) return pannes;
    return pannes.filter(
      (p) => String(p.id_immobilisation) === String(form.id_immobilisation)
    );
  }, [pannes, form.id_immobilisation]);

  const openCreate = () => {
    setEditItem(null);
    setForm(defaultForm);
    setOpen(true);
  };

  const openEdit = (row) => {
    setEditItem(row);
    setForm({
      id_immobilisation: String(row.id_immobilisation),
      id_panne: row.id_panne ? String(row.id_panne) : '',
      date_planifiee: row.date_planifiee?.slice?.(0, 10) || row.date_planifiee,
      type_maintenance: row.type_maintenance,
      cout_prevu: String(row.cout_prevu ?? 0),
      observation: row.observation || '',
      statut: row.statut,
    });
    setOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?.id_user) {
      setError('Utilisateur non identifié');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        id_immobilisation: Number(form.id_immobilisation),
        id_panne: form.id_panne ? Number(form.id_panne) : null,
        id_technicien: user.id_user,
        date_planifiee: form.date_planifiee,
        type_maintenance: form.type_maintenance,
        cout_prevu: Number(form.cout_prevu) || 0,
        observation: form.observation || null,
        statut: form.statut,
      };
      if (editItem) {
        await maintenancesService.update(editItem.id_maintenance, {
          id_panne: payload.id_panne,
          id_technicien: payload.id_technicien,
          date_planifiee: payload.date_planifiee,
          type_maintenance: payload.type_maintenance,
          cout_prevu: payload.cout_prevu,
          observation: payload.observation,
          statut: payload.statut,
        });
      } else {
        await maintenancesService.create(payload);
      }
      setOpen(false);
      reload();
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      key: 'equipement',
      label: 'Équipement',
      render: (r) => immoMap[r.id_immobilisation]?.nom || `#${r.id_immobilisation}`,
    },
    {
      key: 'panne',
      label: 'Panne liée',
      render: (r) =>
        r.id_panne ? `#${r.id_panne} — ${panneMap[r.id_panne]?.description?.slice(0, 40) || ''}` : '—',
    },
    {
      key: 'technicien',
      label: 'Technicien',
      render: (r) =>
        r.id_technicien === user?.id_user ? 'Vous' : `Technicien #${r.id_technicien}`,
    },
    { key: 'date_planifiee', label: 'Date planifiée', render: (r) => formatDate(r.date_planifiee) },
    {
      key: 'type',
      label: 'Type',
      render: (r) => formatTypeMaintenance(r.type_maintenance),
    },
    {
      key: 'statut',
      label: 'Statut',
      render: (r) => (
        <Badge variant={statutMaintenanceVariant(r.statut)} dot>
          {formatStatutMaintenance(r.statut)}
        </Badge>
      ),
    },
    {
      key: 'cout',
      label: 'Coût prévu',
      render: (r) => formatDollar(r.cout_prevu),
    },
    {
      key: 'action',
      label: 'Action',
      render: (r) => (
        <button
          type="button"
          onClick={() => openEdit(r)}
          className="text-sm font-medium text-blue-600 hover:underline"
        >
          Modifier
        </button>
      ),
    },
  ];

  return (
    <>
      <Header placeholder="Rechercher une maintenance..." onSearch={setSearch} />
      <div className="flex-1 p-6">
        <PageHeader
          title="Gestion des maintenances"
          description="Planification des maintenances préventives et correctives."
          action={
            <div className="flex flex-wrap items-center gap-2">
              <ExportPdfButton onExport={exportsService.exportMaintenancesPdf} />
              <button
                type="button"
                onClick={openCreate}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                <Plus className="h-4 w-4" />
                Planifier une maintenance
              </button>
            </div>
          }
        />
        <AlertBanner message={error} onClose={() => setError(null)} />

        {loading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="Aucune maintenance"
            description="Planifiez une intervention préventive ou corrective."
          />
        ) : (
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <DataTable columns={columns} data={filtered} rowKey="id_maintenance" />
          </div>
        )}

        <Modal
          open={open}
          title={editItem ? 'Modifier la maintenance' : 'Planifier une maintenance'}
          onClose={() => setOpen(false)}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label="Équipement">
              <select
                required
                disabled={!!editItem}
                className={inputClass}
                value={form.id_immobilisation}
                onChange={(e) =>
                  setForm({ ...form, id_immobilisation: e.target.value, id_panne: '' })
                }
              >
                <option value="">Sélectionner...</option>
                {immobilisations.map((i) => (
                  <option key={i.id_immobilisation} value={i.id_immobilisation}>
                    {i.nom}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Panne liée (optionnel)">
              <select
                className={inputClass}
                value={form.id_panne}
                onChange={(e) => setForm({ ...form, id_panne: e.target.value })}
              >
                <option value="">Aucune</option>
                {pannesForImmo.map((p) => (
                  <option key={p.id_panne} value={p.id_panne}>
                    #{p.id_panne} — {p.description?.slice(0, 50)}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Date planifiée">
              <input
                type="date"
                required
                className={inputClass}
                value={form.date_planifiee}
                onChange={(e) => setForm({ ...form, date_planifiee: e.target.value })}
              />
            </FormField>
            <FormField label="Type">
              <select
                className={inputClass}
                value={form.type_maintenance}
                onChange={(e) => setForm({ ...form, type_maintenance: e.target.value })}
              >
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {formatTypeMaintenance(t)}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Coût prévu ($)">
              <input
                type="number"
                min="0"
                step="0.01"
                className={inputClass}
                value={form.cout_prevu}
                onChange={(e) => setForm({ ...form, cout_prevu: e.target.value })}
              />
            </FormField>
            <FormField label="Observation">
              <textarea
                rows={3}
                className={inputClass}
                value={form.observation}
                onChange={(e) => setForm({ ...form, observation: e.target.value })}
              />
            </FormField>
            <FormField label="Statut">
              <select
                className={inputClass}
                value={form.statut}
                onChange={(e) => setForm({ ...form, statut: e.target.value })}
              >
                {STATUTS.map((s) => (
                  <option key={s} value={s}>
                    {formatStatutMaintenance(s)}
                  </option>
                ))}
              </select>
            </FormField>
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-lg bg-slate-900 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </form>
        </Modal>
      </div>
    </>
  );
}
