import { useMemo, useState } from 'react';
import { Cog, MoreVertical, Pencil, Plus } from 'lucide-react';
import useFetch from '../../hooks/useFetch';
import { piecesService } from '../../services/pieces';
import { stockService } from '../../services/stock';
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
import { getStockEtat } from '../../utils/stockHelpers';
import { computeMagasinierAggregates } from '../../utils/stockHelpers';

const emptyForm = {
  nom_piece: '',
  reference_piece: '',
  description: '',
  prix_marche: '',
  quantite_initiale: '0',
  seuil_alerte: '1',
};

export default function MagasinierPiecesPage() {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [menuOpen, setMenuOpen] = useState(null);
  const [saving, setSaving] = useState(false);

  const { data, loading, error, setError, reload } = useFetch(() => piecesService.list(), []);
  const { data: stocks } = useFetch(() => stockService.list(), []);

  const stockMap = useMemo(() => {
    const m = {};
    stocks.forEach((s) => {
      m[s.id_piece] = s;
    });
    return m;
  }, [stocks]);

  const agg = useMemo(
    () => computeMagasinierAggregates({ pieces: data, stocks }),
    [data, stocks]
  );

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(
      (p) =>
        p.nom_piece?.toLowerCase().includes(q) ||
        p.reference_piece?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
    );
  }, [data, search]);

  const openCreate = () => {
    setEditItem(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (p) => {
    setEditItem(p);
    setForm({
      nom_piece: p.nom_piece || '',
      reference_piece: p.reference_piece || '',
      description: p.description || '',
      prix_marche: String(p.prix_marche ?? ''),
      quantite_initiale: '',
      seuil_alerte: '',
    });
    setOpen(true);
    setMenuOpen(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editItem) {
        await piecesService.update(editItem.id_piece, {
          nom_piece: form.nom_piece,
          reference_piece: form.reference_piece || null,
          description: form.description || null,
          prix_marche: Number(form.prix_marche),
        });
      } else {
        await piecesService.create({
          nom_piece: form.nom_piece,
          reference_piece: form.reference_piece || null,
          description: form.description || null,
          prix_marche: Number(form.prix_marche) || 0,
          quantite_initiale: Number(form.quantite_initiale) || 0,
          seuil_alerte: Number(form.seuil_alerte) || 1,
        });
      }
      setOpen(false);
      setForm(emptyForm);
      reload();
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      key: 'nom_piece',
      label: 'Pièce & référence',
      render: (r) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <Cog className="h-4 w-4" />
          </div>
          <div>
            <p className="font-semibold text-slate-900">{r.nom_piece}</p>
            <p className="text-xs text-slate-500">Réf. {r.reference_piece || '—'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'prix_marche',
      label: 'Prix du marché ($)',
      render: (r) => formatDollar(r.prix_marche),
    },
    {
      key: 'stock',
      label: 'Disponibilité',
      render: (r) => {
        const st = stockMap[r.id_piece];
        const qty = st?.quantite_disponible ?? 0;
        const etat = getStockEtat(qty, st?.seuil_alerte);
        return <Badge variant={etat.variant} dot>{etat.label}</Badge>;
      },
    },
    {
      key: 'created_at',
      label: 'Créée le',
      render: (r) => formatDate(r.created_at),
    },
    {
      key: 'actions',
      label: '',
      render: (r) => (
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen(menuOpen === r.id_piece ? null : r.id_piece)}
            className="rounded p-1 hover:bg-slate-100"
          >
            <MoreVertical className="h-4 w-4 text-slate-500" />
          </button>
          {menuOpen === r.id_piece && (
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
        placeholder="Rechercher une pièce..."
        action={
          <button
            type="button"
            onClick={openCreate}
            className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" /> Ajouter une pièce
          </button>
        }
      />
      <div className="flex-1 p-6">
        <PageHeader
          title="Pièces de rechange"
          description="Répertoire des composants critiques et inventaire de maintenance."
        />
        <AlertBanner message={error} onClose={() => setError(null)} />

        {!loading && data.length > 0 && (
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total pièces" value={agg.totalPieces} icon={Cog} />
            <StatCard label="Valeur du stock ($)" value={formatDollar(agg.valeurStock)} icon={Cog} />
            <StatCard label="En alerte" value={agg.stockFaible + agg.rupture} accent="red" />
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState title={search ? 'Aucune pièce trouvée' : 'Aucune pièce enregistrée'} />
        ) : (
          <DataTable
            columns={columns}
            data={filtered}
            rowKey="id_piece"
            footer={`Affichage de ${filtered.length} sur ${data.length} pièce${data.length > 1 ? 's' : ''}`}
          />
        )}
      </div>

      <Modal
        open={open}
        title={editItem ? 'Modifier la pièce' : 'Nouvelle pièce de rechange'}
        onClose={() => setOpen(false)}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Nom de la pièce">
            <input required className={inputClass} value={form.nom_piece} onChange={(e) => setForm({ ...form, nom_piece: e.target.value })} />
          </FormField>
          <FormField label="Référence">
            <input className={inputClass} value={form.reference_piece} onChange={(e) => setForm({ ...form, reference_piece: e.target.value })} />
          </FormField>
          <FormField label="Description">
            <textarea className={inputClass} rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </FormField>
          <FormField label="Prix du marché ($)">
            <input required type="number" step="0.01" min={0} className={inputClass} value={form.prix_marche} onChange={(e) => setForm({ ...form, prix_marche: e.target.value })} />
          </FormField>
          {!editItem && (
            <>
              <FormField label="Stock initial">
                <input type="number" min={0} className={inputClass} value={form.quantite_initiale} onChange={(e) => setForm({ ...form, quantite_initiale: e.target.value })} />
              </FormField>
              <FormField label="Seuil d'alerte">
                <input type="number" min={1} className={inputClass} value={form.seuil_alerte} onChange={(e) => setForm({ ...form, seuil_alerte: e.target.value })} />
              </FormField>
            </>
          )}
          <button type="submit" disabled={saving} className="w-full rounded-lg bg-slate-900 py-2.5 text-sm font-medium text-white disabled:opacity-60">
            {editItem ? 'Enregistrer' : 'Créer la pièce'}
          </button>
        </form>
      </Modal>
    </>
  );
}
