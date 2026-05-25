import { useMemo, useState } from 'react';
import { AlertTriangle, Plus } from 'lucide-react';
import useFetch from '../../hooks/useFetch';
import { useAuth } from '../../context/AuthContext';
import { pannesService } from '../../services/pannes';
import { immobilisationsService } from '../../services/immobilisations';
import Header from '../../components/layout/Header';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import AlertBanner from '../../components/ui/AlertBanner';
import EmptyState from '../../components/ui/EmptyState';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import { FormField, inputClass } from '../../components/ui/FormCard';
import { formatDate } from '../../utils/format';
import {
  formatGravite,
  formatStatutPanne,
  graviteVariant,
  statutPanneVariant,
} from '../../utils/technicienHelpers';
import ExportPdfButton from '../../components/ui/ExportPdfButton';
import { exportsService } from '../../services/exports';

const GRAVITES = ['FAIBLE', 'MOYENNE', 'ELEVEE', 'CRITIQUE'];
const STATUTS = ['DECLAREE', 'EN_COURS', 'RESOLUE', 'ANNULEE'];

const defaultForm = {
  id_immobilisation: '',
  date_panne: new Date().toISOString().slice(0, 10),
  description: '',
  gravite: 'MOYENNE',
};

export default function TechnicienPannesPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editStatut, setEditStatut] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

  const { data, loading, error, setError, reload } = useFetch(() => pannesService.list(), []);
  const { data: immobilisations } = useFetch(() => immobilisationsService.list(), []);

  const immoMap = useMemo(() => {
    const m = {};
    immobilisations.forEach((i) => {
      m[i.id_immobilisation] = i;
    });
    return m;
  }, [immobilisations]);

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter((p) => {
      const im = immoMap[p.id_immobilisation];
      return (
        im?.nom?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.statut?.toLowerCase().includes(q)
      );
    });
  }, [data, search, immoMap]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await pannesService.create({
        id_immobilisation: Number(form.id_immobilisation),
        date_panne: form.date_panne,
        description: form.description,
        gravite: form.gravite,
        statut: 'DECLAREE',
      });
      setOpen(false);
      setForm(defaultForm);
      reload();
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors de la déclaration');
    } finally {
      setSaving(false);
    }
  };

  const handleStatut = async (e) => {
    e.preventDefault();
    if (!editStatut) return;
    setSaving(true);
    try {
      await pannesService.update(editStatut.id_panne, { statut: editStatut.statut });
      setEditStatut(null);
      reload();
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      key: 'equipement',
      label: 'Équipement',
      render: (r) => (
        <div>
          <p className="font-semibold text-slate-900">
            {immoMap[r.id_immobilisation]?.nom || `ID ${r.id_immobilisation}`}
          </p>
          <p className="text-xs text-slate-500">
            {immoMap[r.id_immobilisation]?.code_inventaire || '—'}
          </p>
        </div>
      ),
    },
    { key: 'date_panne', label: 'Date panne', render: (r) => formatDate(r.date_panne) },
    {
      key: 'description',
      label: 'Description',
      render: (r) => (
        <span className="line-clamp-2 max-w-xs text-sm text-slate-600">{r.description || '—'}</span>
      ),
    },
    {
      key: 'gravite',
      label: 'Gravité',
      render: (r) => <Badge variant={graviteVariant(r.gravite)}>{formatGravite(r.gravite)}</Badge>,
    },
    {
      key: 'statut',
      label: 'Statut',
      render: (r) => (
        <Badge variant={statutPanneVariant(r.statut)} dot>
          {formatStatutPanne(r.statut)}
        </Badge>
      ),
    },
    {
      key: 'declarant',
      label: 'Déclarant',
      render: (r) =>
        r.id_declarant === user?.id_user ? 'Vous' : `Utilisateur #${r.id_declarant}`,
    },
    {
      key: 'created_at',
      label: 'Créée le',
      render: (r) => formatDate(r.created_at),
    },
    {
      key: 'action',
      label: 'Action',
      render: (r) => (
        <button
          type="button"
          onClick={() => setEditStatut({ id_panne: r.id_panne, statut: r.statut })}
          className="text-sm font-medium text-blue-600 hover:underline"
        >
          Modifier statut
        </button>
      ),
    },
  ];

  return (
    <>
      <Header placeholder="Rechercher une panne..." onSearch={setSearch} />
      <div className="flex-1 p-6">
        <PageHeader
          title="Gestion des pannes"
          description="Déclaration et suivi des interruptions de production."
          action={
            <div className="flex flex-wrap items-center gap-2">
              <ExportPdfButton onExport={exportsService.exportPannesPdf} />
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                <Plus className="h-4 w-4" />
                Nouvelle panne
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
            title="Aucune panne"
            description="Déclarez une panne pour commencer le suivi."
          />
        ) : (
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <DataTable columns={columns} data={filtered} rowKey="id_panne" />
          </div>
        )}

        <Modal open={open} title="Déclarer une panne" onClose={() => setOpen(false)}>
          <form onSubmit={handleCreate} className="space-y-4">
            <FormField label="Équipement">
              <select
                required
                className={inputClass}
                value={form.id_immobilisation}
                onChange={(e) => setForm({ ...form, id_immobilisation: e.target.value })}
              >
                <option value="">Sélectionner un équipement...</option>
                {immobilisations.map((i) => (
                  <option key={i.id_immobilisation} value={i.id_immobilisation}>
                    {i.nom} {i.code_inventaire ? `(${i.code_inventaire})` : ''}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Date de panne">
              <input
                type="date"
                required
                className={inputClass}
                value={form.date_panne}
                onChange={(e) => setForm({ ...form, date_panne: e.target.value })}
              />
            </FormField>
            <FormField label="Gravité">
              <select
                className={inputClass}
                value={form.gravite}
                onChange={(e) => setForm({ ...form, gravite: e.target.value })}
              >
                {GRAVITES.map((g) => (
                  <option key={g} value={g}>
                    {formatGravite(g)}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Description">
              <textarea
                required
                rows={4}
                className={inputClass}
                placeholder="Décrivez le problème observé..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </FormField>
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-lg bg-slate-900 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {saving ? 'Envoi...' : 'Soumettre le rapport'}
            </button>
          </form>
        </Modal>

        <Modal open={!!editStatut} title="Modifier le statut" onClose={() => setEditStatut(null)}>
          <form onSubmit={handleStatut} className="space-y-4">
            <FormField label="Statut">
              <select
                className={inputClass}
                value={editStatut?.statut || ''}
                onChange={(e) => setEditStatut({ ...editStatut, statut: e.target.value })}
              >
                {STATUTS.map((s) => (
                  <option key={s} value={s}>
                    {formatStatutPanne(s)}
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
