import { useMemo, useState } from 'react';
import { FolderTree, Plus } from 'lucide-react';
import useFetch from '../../hooks/useFetch';
import { categoriesImmobilisationsService } from '../../services/categoriesImmobilisations';
import { immobilisationsService } from '../../services/immobilisations';
import Header from '../../components/layout/Header';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import DataTable from '../../components/ui/DataTable';
import AlertBanner from '../../components/ui/AlertBanner';
import EmptyState from '../../components/ui/EmptyState';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Modal from '../../components/ui/Modal';
import { FormField, inputClass } from '../../components/ui/FormCard';
import { formatImmoCountByCategory } from '../../utils/categoryKind';

const emptyForm = {
  nom_categorie: '',
  description: '',
  duree_vie_defaut: '',
  taux_amortissement_defaut: '',
};

export default function ComptableCategoriesPage() {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const { data, loading, error, setError, reload } = useFetch(
    () => categoriesImmobilisationsService.list(),
    []
  );
  const { data: immobilisations } = useFetch(() => immobilisationsService.list(), []);

  const countByCategory = useMemo(() => {
    const m = {};
    immobilisations.forEach((im) => {
      m[im.id_categorie] = (m[im.id_categorie] || 0) + 1;
    });
    return m;
  }, [immobilisations]);

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(
      (c) =>
        c.nom_categorie?.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q)
    );
  }, [data, search]);

  const columns = [
    {
      key: 'nom_categorie',
      label: 'Catégorie',
      render: (r) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <FolderTree className="h-4 w-4" />
          </div>
          <div>
            <p className="font-semibold text-slate-900">{r.nom_categorie}</p>
            <p className="text-xs text-slate-500">
              {formatImmoCountByCategory(countByCategory[r.id_categorie] ?? 0)}
              {r.description ? ` · ${r.description}` : ''}
            </p>
          </div>
        </div>
      ),
    },
    { key: 'duree_vie_defaut', label: 'Durée par défaut (ans)', render: (r) => r.duree_vie_defaut ?? '—' },
    {
      key: 'taux_amortissement_defaut',
      label: 'Taux par défaut (%)',
      render: (r) => (r.taux_amortissement_defaut != null ? `${r.taux_amortissement_defaut}` : '—'),
    },
    {
      key: 'count',
      label: 'Immobilisations',
      render: (r) => {
        const count = countByCategory[r.id_categorie] ?? 0;
        return (
          <span className="font-medium text-slate-700">
            {formatImmoCountByCategory(count)}
          </span>
        );
      },
    },
  ];

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await categoriesImmobilisationsService.create({
        nom_categorie: form.nom_categorie,
        description: form.description || null,
        duree_vie_defaut: form.duree_vie_defaut ? Number(form.duree_vie_defaut) : null,
        taux_amortissement_defaut: form.taux_amortissement_defaut
          ? Number(form.taux_amortissement_defaut)
          : null,
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
        placeholder="Rechercher une catégorie..."
        action={
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" /> Nouvelle catégorie
          </button>
        }
      />
      <div className="flex-1 p-6">
        <PageHeader
          title="Catégories d'immobilisations"
          description="Gérez vos classes d'actifs et les paramètres d'amortissement par défaut."
        />
        <AlertBanner message={error} onClose={() => setError(null)} />

        {!loading && data.length > 0 && (
          <div className="mb-6 max-w-xs">
            <StatCard label="Catégories définies" value={data.length} icon={FolderTree} />
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState title={search ? 'Aucune catégorie trouvée' : 'Aucune catégorie enregistrée'} />
        ) : (
          <DataTable
            columns={columns}
            data={filtered}
            rowKey="id_categorie"
            footer={`Affichage de ${filtered.length} sur ${data.length} catégorie${data.length > 1 ? 's' : ''}`}
          />
        )}
      </div>

      <Modal open={open} title="Nouvelle catégorie" onClose={() => setOpen(false)}>
        <form onSubmit={handleCreate} className="space-y-4">
          <FormField label="Nom de la catégorie">
            <input
              required
              className={inputClass}
              value={form.nom_categorie}
              onChange={(e) => setForm({ ...form, nom_categorie: e.target.value })}
            />
          </FormField>
          <FormField label="Description">
            <textarea
              className={inputClass}
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </FormField>
          <FormField label="Durée de vie par défaut (années)">
            <input
              type="number"
              min={1}
              className={inputClass}
              value={form.duree_vie_defaut}
              onChange={(e) => setForm({ ...form, duree_vie_defaut: e.target.value })}
            />
          </FormField>
          <FormField label="Taux d'amortissement par défaut (%)">
            <input
              type="number"
              step="0.01"
              min={0}
              className={inputClass}
              value={form.taux_amortissement_defaut}
              onChange={(e) => setForm({ ...form, taux_amortissement_defaut: e.target.value })}
            />
          </FormField>
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-slate-900 py-2.5 text-sm font-medium text-white disabled:opacity-60"
          >
            Créer
          </button>
        </form>
      </Modal>
    </>
  );
}
