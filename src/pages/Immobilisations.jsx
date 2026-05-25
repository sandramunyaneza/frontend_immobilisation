import { useState } from 'react';
import { Plus } from 'lucide-react';
import useFetch from '../hooks/useFetch';
import { immobilisationsService } from '../services/immobilisations';
import { categoriesImmobilisationsService } from '../services/categoriesImmobilisations';
import ResourceListPage from '../components/pages/ResourceListPage';
import Modal from '../components/ui/Modal';

const defaultForm = {
  nom: '',
  code_inventaire: '',
  date_acquisition: '',
  valeur_achat: '',
  duree_vie: '',
  type_immobilisation: 'ORDINATEUR',
  id_categorie: '',
};

export default function ImmobilisationsPage() {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const { data, loading, error, setError, reload } = useFetch(
    () => immobilisationsService.list(),
    []
  );
  const { data: categories } = useFetch(() => categoriesImmobilisationsService.list(), []);

  const columns = [
    { key: 'nom', label: 'Nom' },
    { key: 'code_inventaire', label: 'Code inventaire' },
    { key: 'type_immobilisation', label: 'Type' },
    { key: 'statut', label: 'Statut' },
    { key: 'valeur_achat', label: 'Valeur achat' },
  ];

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await immobilisationsService.create({
        ...form,
        valeur_achat: Number(form.valeur_achat),
        duree_vie: Number(form.duree_vie),
        id_categorie: Number(form.id_categorie),
      });
      setOpen(false);
      setForm(defaultForm);
      reload();
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur création');
    }
  };

  return (
    <>
      <ResourceListPage
        title="Immobilisations"
        description="Inventaire des biens immobilisés de l'organisation."
        columns={columns}
        data={data}
        loading={loading}
        error={error}
        setError={setError}
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Rechercher une immobilisation..."
        action={
          <button type="button" onClick={() => setOpen(true)} className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm text-white">
            <Plus className="h-4 w-4" /> Nouvelle immobilisation
          </button>
        }
      />
      <Modal open={open} title="Nouvelle immobilisation" onClose={() => setOpen(false)}>
        <form onSubmit={handleCreate} className="space-y-3">
          {['nom', 'code_inventaire', 'date_acquisition', 'valeur_achat', 'duree_vie'].map((f) => (
            <input
              key={f}
              required={f !== 'code_inventaire'}
              type={f.includes('date') ? 'date' : f.includes('valeur') || f.includes('duree') ? 'number' : 'text'}
              placeholder={f.replace('_', ' ')}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              value={form[f]}
              onChange={(e) => setForm({ ...form, [f]: e.target.value })}
            />
          ))}
          <select className="w-full rounded-lg border px-3 py-2 text-sm" value={form.type_immobilisation} onChange={(e) => setForm({ ...form, type_immobilisation: e.target.value })}>
            {['VEHICULE', 'MACHINE', 'ORDINATEUR', 'AUTRE'].map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <select required className="w-full rounded-lg border px-3 py-2 text-sm" value={form.id_categorie} onChange={(e) => setForm({ ...form, id_categorie: e.target.value })}>
            <option value="">Catégorie</option>
            {categories.map((c) => (
              <option key={c.id_categorie} value={c.id_categorie}>{c.nom_categorie}</option>
            ))}
          </select>
          <button type="submit" className="w-full rounded-lg bg-blue-600 py-2 text-sm text-white">Créer</button>
        </form>
      </Modal>
    </>
  );
}
