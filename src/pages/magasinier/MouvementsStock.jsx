import { useMemo, useState } from 'react';
import { ArrowLeftRight, Plus } from 'lucide-react';
import useFetch from '../../hooks/useFetch';
import { mouvementsStockService } from '../../services/mouvementsStock';
import { piecesService } from '../../services/pieces';
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
import { formatTypeMouvement } from '../../utils/stockHelpers';
import ExportPdfButton from '../../components/ui/ExportPdfButton';
import { exportsService } from '../../services/exports';

const TYPES = [
  { value: 'ENTREE', label: 'Entrée' },
  { value: 'SORTIE', label: 'Sortie' },
  { value: 'AJUSTEMENT', label: 'Ajustement' },
];

const emptyForm = {
  id_piece: '',
  type_mouvement: 'ENTREE',
  quantite: '',
  motif: '',
};

export default function MagasinierMouvementsPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const { data, loading, error, setError, reload } = useFetch(
    () => mouvementsStockService.list(),
    []
  );
  const { data: pieces } = useFetch(() => piecesService.list(), []);

  const pieceMap = useMemo(() => {
    const m = {};
    pieces.forEach((p) => {
      m[p.id_piece] = p;
    });
    return m;
  }, [pieces]);

  const filtered = useMemo(() => {
    let list = data;
    if (typeFilter) list = list.filter((m) => m.type_mouvement === typeFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((m) => {
        const p = pieceMap[m.id_piece];
        return (
          p?.nom_piece?.toLowerCase().includes(q) ||
          m.motif?.toLowerCase().includes(q) ||
          m.type_mouvement?.toLowerCase().includes(q)
        );
      });
    }
    return [...list].sort((a, b) => new Date(b.date_mouvement) - new Date(a.date_mouvement));
  }, [data, search, typeFilter, pieceMap]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await mouvementsStockService.create({
        id_piece: Number(form.id_piece),
        type_mouvement: form.type_mouvement,
        quantite: Number(form.quantite),
        motif: form.motif || null,
      });
      setOpen(false);
      setForm(emptyForm);
      reload();
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors de l\'enregistrement du mouvement');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      key: 'date_mouvement',
      label: 'Date & heure',
      render: (r) =>
        r.date_mouvement
          ? new Date(r.date_mouvement).toLocaleString('fr-FR')
          : '—',
    },
    {
      key: 'type_mouvement',
      label: 'Type',
      render: (r) => (
        <Badge
          variant={
            r.type_mouvement === 'ENTREE'
              ? 'success'
              : r.type_mouvement === 'SORTIE'
                ? 'warning'
                : 'info'
          }
        >
          {formatTypeMouvement(r.type_mouvement)}
        </Badge>
      ),
    },
    {
      key: 'id_piece',
      label: 'Pièce',
      render: (r) => pieceMap[r.id_piece]?.nom_piece || `ID ${r.id_piece}`,
    },
    {
      key: 'quantite',
      label: 'Quantité',
      render: (r) => {
        const prefix = r.type_mouvement === 'ENTREE' ? '+' : r.type_mouvement === 'SORTIE' ? '−' : '=';
        return (
          <span className={r.type_mouvement === 'ENTREE' ? 'font-medium text-emerald-600' : ''}>
            {prefix}
            {r.quantite}
          </span>
        );
      },
    },
    { key: 'motif', label: 'Motif' },
    {
      key: 'id_utilisateur',
      label: 'Utilisateur',
      render: (r) => (r.id_utilisateur ? `#${r.id_utilisateur}` : '—'),
    },
  ];

  return (
    <>
      <Header
        search={search}
        onSearch={setSearch}
        placeholder="Rechercher une pièce ou un mouvement..."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <ExportPdfButton onExport={exportsService.exportMouvementsStockPdf} />
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" /> Enregistrer un mouvement
            </button>
          </div>
        }
      />
      <div className="flex-1 p-6">
        <PageHeader
          title="Mouvements de stock"
          description="Historique des entrées, sorties et ajustements d'inventaire."
        />
        <AlertBanner message={error} onClose={() => setError(null)} />

        <div className="mb-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTypeFilter('')}
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${!typeFilter ? 'bg-slate-900 text-white' : 'bg-white ring-1 ring-slate-200'}`}
          >
            Tous
          </button>
          {TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setTypeFilter(t.value)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                typeFilter === t.value ? 'bg-slate-900 text-white' : 'bg-white ring-1 ring-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState title="Aucun mouvement enregistré" />
        ) : (
          <DataTable
            columns={columns}
            data={filtered}
            rowKey="id_mouvement"
            footer={`Affichage de ${filtered.length} sur ${data.length} mouvement${data.length > 1 ? 's' : ''}`}
          />
        )}
      </div>

      <Modal open={open} title="Nouveau mouvement de stock" onClose={() => setOpen(false)}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Pièce">
            <select
              required
              className={inputClass}
              value={form.id_piece}
              onChange={(e) => setForm({ ...form, id_piece: e.target.value })}
            >
              <option value="">Choisir une pièce</option>
              {pieces.map((p) => (
                <option key={p.id_piece} value={p.id_piece}>
                  {p.nom_piece} ({p.reference_piece || p.id_piece})
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Type de mouvement">
            <select
              className={inputClass}
              value={form.type_mouvement}
              onChange={(e) => setForm({ ...form, type_mouvement: e.target.value })}
            >
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Quantité">
            <input
              required
              type="number"
              min={1}
              className={inputClass}
              value={form.quantite}
              onChange={(e) => setForm({ ...form, quantite: e.target.value })}
            />
          </FormField>
          {form.type_mouvement === 'AJUSTEMENT' && (
            <p className="text-xs text-slate-500">
              Un ajustement définit la quantité disponible à la valeur saisie.
            </p>
          )}
          <FormField label="Motif">
            <textarea
              className={inputClass}
              rows={2}
              value={form.motif}
              onChange={(e) => setForm({ ...form, motif: e.target.value })}
            />
          </FormField>
          <button
            type="submit"
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 py-2.5 text-sm font-medium text-white disabled:opacity-60"
          >
            <ArrowLeftRight className="h-4 w-4" />
            Enregistrer
          </button>
        </form>
      </Modal>
    </>
  );
}
