import { useMemo, useState } from 'react';
import { Hammer, Plus } from 'lucide-react';
import useFetch from '../../hooks/useFetch';
import { useAuth } from '../../context/AuthContext';
import { reparationsService } from '../../services/reparations';
import { maintenancesService } from '../../services/maintenances';
import { pannesService } from '../../services/pannes';
import Header from '../../components/layout/Header';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import AlertBanner from '../../components/ui/AlertBanner';
import EmptyState from '../../components/ui/EmptyState';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Modal from '../../components/ui/Modal';
import { FormField, inputClass } from '../../components/ui/FormCard';
import { formatDate, formatDollar } from '../../utils/format';
import ExportPdfButton from '../../components/ui/ExportPdfButton';
import { exportsService } from '../../services/exports';

const defaultForm = {
  id_maintenance: '',
  id_panne: '',
  date_realisation: new Date().toISOString().slice(0, 10),
  description: '',
  cout: '0',
};

export default function TechnicienReparationsPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

  const { data, loading, error, setError, reload } = useFetch(
    () => reparationsService.list(),
    []
  );
  const { data: maintenances } = useFetch(() => maintenancesService.list(), []);
  const { data: pannes } = useFetch(() => pannesService.list(), []);

  const maintMap = useMemo(() => {
    const m = {};
    maintenances.forEach((x) => {
      m[x.id_maintenance] = x;
    });
    return m;
  }, [maintenances]);

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
    return data.filter(
      (r) =>
        r.description?.toLowerCase().includes(q) ||
        String(r.id_maintenance).includes(q)
    );
  }, [data, search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?.id_user) {
      setError('Utilisateur non identifié');
      return;
    }
    setSaving(true);
    try {
      await reparationsService.create({
        id_maintenance: Number(form.id_maintenance),
        id_panne: form.id_panne ? Number(form.id_panne) : null,
        id_technicien: user.id_user,
        date_realisation: form.date_realisation,
        description: form.description || null,
        cout: Number(form.cout) || 0,
      });
      setOpen(false);
      setForm(defaultForm);
      reload();
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      key: 'maintenance',
      label: 'Maintenance',
      render: (r) => `#${r.id_maintenance}`,
    },
    {
      key: 'panne',
      label: 'Panne liée',
      render: (r) =>
        r.id_panne
          ? `#${r.id_panne} — ${panneMap[r.id_panne]?.description?.slice(0, 40) || ''}`
          : '—',
    },
    {
      key: 'technicien',
      label: 'Technicien',
      render: (r) =>
        r.id_technicien === user?.id_user ? 'Vous' : `Technicien #${r.id_technicien}`,
    },
    { key: 'date_realisation', label: 'Date réalisation', render: (r) => formatDate(r.date_realisation) },
    {
      key: 'description',
      label: 'Description',
      render: (r) => (
        <span className="line-clamp-2 max-w-xs text-sm text-slate-600">{r.description || '—'}</span>
      ),
    },
    { key: 'cout', label: 'Coût', render: (r) => formatDollar(r.cout) },
    {
      key: 'created_at',
      label: 'Enregistrée le',
      render: (r) => formatDate(r.created_at),
    },
  ];

  return (
    <>
      <Header placeholder="Rechercher une réparation..." onSearch={setSearch} />
      <div className="flex-1 p-6">
        <PageHeader
          title="Réparations"
          description="Enregistrement des réparations liées aux maintenances."
          action={
            <div className="flex flex-wrap items-center gap-2">
              <ExportPdfButton onExport={exportsService.exportReparationsPdf} />
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                <Plus className="h-4 w-4" />
                Enregistrer une réparation
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
            title="Aucune réparation"
            description="Enregistrez une réparation après une intervention."
          />
        ) : (
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <DataTable columns={columns} data={filtered} rowKey="id_reparation" />
          </div>
        )}

        <Modal open={open} title="Enregistrer une réparation" onClose={() => setOpen(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label="Maintenance concernée">
              <select
                required
                className={inputClass}
                value={form.id_maintenance}
                onChange={(e) => setForm({ ...form, id_maintenance: e.target.value })}
              >
                <option value="">Sélectionner...</option>
                {maintenances.map((m) => (
                  <option key={m.id_maintenance} value={m.id_maintenance}>
                    #{m.id_maintenance} — {m.type_maintenance} ({m.statut})
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
                {pannes.map((p) => (
                  <option key={p.id_panne} value={p.id_panne}>
                    #{p.id_panne} — {p.description?.slice(0, 50)}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Date de réalisation">
              <input
                type="date"
                required
                className={inputClass}
                value={form.date_realisation}
                onChange={(e) => setForm({ ...form, date_realisation: e.target.value })}
              />
            </FormField>
            <FormField label="Description / résultat">
              <textarea
                rows={4}
                className={inputClass}
                placeholder="Résultat de l'intervention..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </FormField>
            <FormField label="Coût ($)">
              <input
                type="number"
                min="0"
                step="0.01"
                className={inputClass}
                value={form.cout}
                onChange={(e) => setForm({ ...form, cout: e.target.value })}
              />
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
