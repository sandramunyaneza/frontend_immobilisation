import { useState } from 'react';
import { Plus } from 'lucide-react';
import useFetch from '../hooks/useFetch';
import { categoriesImmobilisationsService } from '../services/categoriesImmobilisations';
import ResourceListPage from '../components/pages/ResourceListPage';
import Modal from '../components/ui/Modal';

export default function CategoriesImmobilisationsPage() {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [nom, setNom] = useState('');
  const { data, loading, error, setError, reload } = useFetch(
    () => categoriesImmobilisationsService.list(),
    []
  );

  const columns = [
    { key: 'nom_categorie', label: 'Catégorie' },
    { key: 'duree_vie_defaut', label: 'Durée vie (ans)' },
    { key: 'taux_amortissement_defaut', label: 'Taux amort.' },
  ];

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await categoriesImmobilisationsService.create({ nom_categorie: nom });
      setOpen(false);
      setNom('');
      reload();
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur');
    }
  };

  return (
    <>
      <ResourceListPage
        title="Catégories d'immobilisations"
        description="Classifiez vos biens par catégorie comptable."
        columns={columns}
        data={data}
        loading={loading}
        error={error}
        setError={setError}
        search={search}
        onSearch={setSearch}
        action={
          <button type="button" onClick={() => setOpen(true)} className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm text-white">
            <Plus className="h-4 w-4" /> Nouvelle catégorie
          </button>
        }
      />
      <Modal open={open} title="Nouvelle catégorie" onClose={() => setOpen(false)}>
        <form onSubmit={handleCreate} className="space-y-4">
          <input required placeholder="Nom catégorie" className="w-full rounded-lg border px-3 py-2 text-sm" value={nom} onChange={(e) => setNom(e.target.value)} />
          <button type="submit" className="w-full rounded-lg bg-blue-600 py-2 text-sm text-white">Créer</button>
        </form>
      </Modal>
    </>
  );
}
