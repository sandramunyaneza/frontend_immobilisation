import { useMemo, useState } from 'react';
import { Boxes, Minus, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import useFetch from '../../hooks/useFetch';
import { stockService } from '../../services/stock';
import { piecesService } from '../../services/pieces';
import Header from '../../components/layout/Header';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import DataTable from '../../components/ui/DataTable';
import AlertBanner from '../../components/ui/AlertBanner';
import EmptyState from '../../components/ui/EmptyState';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Badge from '../../components/ui/Badge';
import { formatDollar, formatDate } from '../../utils/format';
import { getStockEtat, computeMagasinierAggregates } from '../../utils/stockHelpers';
import ExportPdfButton from '../../components/ui/ExportPdfButton';
import { exportsService } from '../../services/exports';

export default function MagasinierStockPage() {
  const [search, setSearch] = useState('');
  const [filterEtat, setFilterEtat] = useState('');

  const { data: stocks, loading, error, setError } = useFetch(() => stockService.list(), []);
  const { data: pieces } = useFetch(() => piecesService.list(), []);

  const pieceMap = useMemo(() => {
    const m = {};
    pieces.forEach((p) => {
      m[p.id_piece] = p;
    });
    return m;
  }, [pieces]);

  const enriched = useMemo(
    () =>
      stocks.map((s) => {
        const p = pieceMap[s.id_piece];
        const etat = getStockEtat(s.quantite_disponible, s.seuil_alerte);
        return { ...s, piece: p, etat };
      }),
    [stocks, pieceMap]
  );

  const filtered = useMemo(() => {
    let list = enriched;
    if (filterEtat) {
      list = list.filter((r) => r.etat.variant === filterEtat);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.piece?.nom_piece?.toLowerCase().includes(q) ||
          r.piece?.reference_piece?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [enriched, search, filterEtat]);

  const agg = useMemo(
    () => computeMagasinierAggregates({ pieces, stocks }),
    [pieces, stocks]
  );

  const columns = [
    {
      key: 'piece',
      label: 'Pièce & référence',
      render: (r) => (
        <div>
          <p className="font-semibold text-slate-900">{r.piece?.nom_piece || `ID ${r.id_piece}`}</p>
          <p className="text-xs text-slate-500">Réf. {r.piece?.reference_piece || '—'}</p>
        </div>
      ),
    },
    {
      key: 'quantite_disponible',
      label: 'Disponible',
      render: (r) => <span className="font-medium">{r.quantite_disponible} unité{r.quantite_disponible > 1 ? 's' : ''}</span>,
    },
    { key: 'seuil_alerte', label: "Seuil d'alerte" },
    {
      key: 'etat',
      label: 'État',
      render: (r) => <Badge variant={r.etat.variant} dot>{r.etat.label}</Badge>,
    },
    {
      key: 'valeur',
      label: 'Valeur ($)',
      render: (r) => formatDollar((Number(r.piece?.prix_marche) || 0) * r.quantite_disponible),
    },
    {
      key: 'updated_at',
      label: 'Dernière mise à jour',
      render: (r) => formatDate(r.updated_at),
    },
  ];

  return (
    <>
      <Header
        search={search}
        onSearch={setSearch}
        placeholder="Rechercher une pièce ou un mouvement..."
        action={
          <div className="flex flex-wrap gap-2">
            <ExportPdfButton onExport={exportsService.exportStockPdf} />
            <Link
              to="/magasinier/mouvements-stock"
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <Minus className="h-4 w-4" /> Sortie
            </Link>
            <Link
              to="/magasinier/mouvements-stock"
              className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" /> Nouvelle entrée
            </Link>
          </div>
        }
      />
      <div className="flex-1 p-6">
        <PageHeader
          title="Gestion du stock"
          description="Suivi des entrées, sorties et niveaux d'inventaire des pièces de rechange."
        />
        <AlertBanner message={error} onClose={() => setError(null)} />

        {!loading && stocks.length > 0 && (
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Valeur totale du stock" value={formatDollar(agg.valeurStock)} icon={Boxes} />
            <StatCard label="Alertes stock" value={agg.stockFaible} accent="amber" />
            <StatCard label="Ruptures" value={agg.rupture} accent="red" />
          </div>
        )}

        <div className="mb-4 flex flex-wrap gap-2">
          {[
            { value: '', label: 'Tout' },
            { value: 'success', label: 'Stock suffisant' },
            { value: 'warning', label: 'Stock faible' },
            { value: 'danger', label: 'Rupture' },
          ].map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilterEtat(f.value)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                filterEtat === f.value
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState title="Aucun stock à afficher" />
        ) : (
          <DataTable
            columns={columns}
            data={filtered}
            rowKey="id_stock"
            footer={`Affichage de ${filtered.length} sur ${stocks.length} article${stocks.length > 1 ? 's' : ''}`}
          />
        )}
      </div>
    </>
  );
}
