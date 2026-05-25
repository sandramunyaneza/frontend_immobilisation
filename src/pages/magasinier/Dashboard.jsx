import { AlertTriangle, ArrowLeftRight, Boxes, Cog, Package } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardService } from '../../services/dashboard';
import { piecesService } from '../../services/pieces';
import { stockService } from '../../services/stock';
import { mouvementsStockService } from '../../services/mouvementsStock';
import { demandesPiecesService } from '../../services/demandesPieces';
import { computeMagasinierAggregates } from '../../utils/stockHelpers';
import { formatDollar, formatDate } from '../../utils/format';
import { formatTypeMouvement } from '../../utils/stockHelpers';
import Header from '../../components/layout/Header';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import DataTable from '../../components/ui/DataTable';
import AlertBanner from '../../components/ui/AlertBanner';
import EmptyState from '../../components/ui/EmptyState';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Badge from '../../components/ui/Badge';

export default function MagasinierDashboard() {
  const [stats, setStats] = useState(null);
  const [agg, setAgg] = useState(null);
  const [mouvements, setMouvements] = useState([]);
  const [pieceMap, setPieceMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      dashboardService.stats().catch(() => null),
      piecesService.list().catch(() => []),
      stockService.list().catch(() => []),
      demandesPiecesService.list().catch(() => []),
      mouvementsStockService.list().catch(() => []),
    ])
      .then(([s, pieces, stocks, demandes, movs]) => {
        setStats(s);
        const p = Array.isArray(pieces) ? pieces : [];
        const st = Array.isArray(stocks) ? stocks : [];
        const d = Array.isArray(demandes) ? demandes : [];
        const m = Array.isArray(movs) ? movs : [];
        setAgg(computeMagasinierAggregates({ pieces: p, stocks: st, demandes: d, mouvements: m }));
        const map = {};
        p.forEach((x) => {
          map[x.id_piece] = x;
        });
        setPieceMap(map);
        setMouvements(
          [...m]
            .sort((a, b) => new Date(b.date_mouvement) - new Date(a.date_mouvement))
            .slice(0, 8)
        );
      })
      .catch((err) =>
        setError(err.response?.data?.detail || 'Impossible de charger le tableau de bord')
      )
      .finally(() => setLoading(false));
  }, []);

  const mouvColumns = [
    {
      key: 'piece',
      label: 'Pièce',
      render: (r) => pieceMap[r.id_piece]?.nom_piece || `ID ${r.id_piece}`,
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
      key: 'quantite',
      label: 'Quantité',
      render: (r) => {
        const sign = r.type_mouvement === 'ENTREE' ? '+' : r.type_mouvement === 'SORTIE' ? '−' : '';
        return (
          <span className={r.type_mouvement === 'ENTREE' ? 'font-medium text-emerald-600' : ''}>
            {sign}
            {r.quantite}
          </span>
        );
      },
    },
    {
      key: 'date_mouvement',
      label: 'Date',
      render: (r) => formatDate(r.date_mouvement),
    },
  ];

  return (
    <>
      <Header placeholder="Rechercher une pièce ou un mouvement..." />
      <div className="flex-1 p-6">
        <PageHeader
          title="Tableau de bord magasinier"
          description="Suivi des pièces de rechange, niveaux de stock et demandes en cours."
        />
        <AlertBanner message={error} onClose={() => setError(null)} />

        {loading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Pièces de rechange" value={agg?.totalPieces ?? '—'} icon={Cog} />
              <StatCard
                label="Stock disponible"
                value={agg?.disponibles ?? '—'}
                hint={agg ? `${agg.stockFaible} en stock faible` : null}
                accent="emerald"
              />
              <StatCard
                label="Alertes stock"
                value={stats?.pieces_stock_faible ?? agg?.stockFaible ?? '—'}
                icon={AlertTriangle}
                accent="red"
              />
              <StatCard
                label="Ruptures"
                value={agg?.rupture ?? '—'}
                icon={AlertTriangle}
                accent="amber"
              />
              <StatCard
                label="Valeur du stock"
                value={agg ? formatDollar(agg.valeurStock) : '—'}
                icon={Boxes}
              />
              <StatCard
                label="Demandes en attente"
                value={stats?.demandes_pieces_en_attente ?? agg?.demandesEnAttente ?? '—'}
                icon={Package}
                accent="amber"
              />
              <StatCard label="Demandes fournies" value={agg?.demandesFournies ?? '—'} icon={Package} />
              <StatCard
                label="Mouvements (entrées / sorties)"
                value={mouvements.length ? `${agg?.entrees24h ?? 0} / ${agg?.sorties24h ?? 0}` : '—'}
                hint="Total enregistrés"
                icon={ArrowLeftRight}
              />
            </div>

            <div className="mt-8">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Derniers mouvements de stock</h2>
                <Link
                  to="/magasinier/mouvements-stock"
                  className="text-sm font-medium text-blue-600 hover:underline"
                >
                  Voir tout
                </Link>
              </div>
              {mouvements.length === 0 ? (
                <EmptyState title="Aucun mouvement enregistré" />
              ) : (
                <DataTable columns={mouvColumns} data={mouvements} rowKey="id_mouvement" />
              )}
            </div>

            <div className="mt-6 flex flex-wrap gap-4 text-sm">
              <Link to="/magasinier/pieces" className="font-medium text-blue-600 hover:underline">
                Pièces de rechange
              </Link>
              <Link to="/magasinier/stock" className="font-medium text-blue-600 hover:underline">
                Gestion du stock
              </Link>
              <Link to="/magasinier/demandes-pieces" className="font-medium text-blue-600 hover:underline">
                Demandes de pièces
              </Link>
            </div>
          </>
        )}
      </div>
    </>
  );
}
