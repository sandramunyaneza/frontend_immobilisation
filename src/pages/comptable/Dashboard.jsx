import { Building2, FolderTree, TrendingDown, FileText, AlertTriangle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardService } from '../../services/dashboard';
import { immobilisationsService } from '../../services/immobilisations';
import { categoriesImmobilisationsService } from '../../services/categoriesImmobilisations';
import { amortissementsService } from '../../services/amortissements';
import { rapportsService } from '../../services/rapports';
import { computeComptableAggregates } from '../../utils/comptableStats';
import { formatDollar, formatDate, formatMethode, isRapportComptable, formatRapportType } from '../../utils/format';
import Header from '../../components/layout/Header';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import DataTable from '../../components/ui/DataTable';
import AlertBanner from '../../components/ui/AlertBanner';
import EmptyState from '../../components/ui/EmptyState';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

export default function ComptableDashboard() {
  const [stats, setStats] = useState(null);
  const [aggregates, setAggregates] = useState(null);
  const [recentAmort, setRecentAmort] = useState([]);
  const [recentRapports, setRecentRapports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      dashboardService.stats().catch(() => null),
      immobilisationsService.list().catch(() => []),
      categoriesImmobilisationsService.list().catch(() => []),
      amortissementsService.list().catch(() => []),
      rapportsService.list().catch(() => []),
    ])
      .then(([s, immos, cats, amorts, rapports]) => {
        setStats(s);
        const immobilisations = Array.isArray(immos) ? immos : [];
        const amortissements = Array.isArray(amorts) ? amorts : [];
        const categories = Array.isArray(cats) ? cats : [];
        setAggregates(
          computeComptableAggregates({ immobilisations, amortissements, categories })
        );
        setRecentAmort(
          [...amortissements]
            .sort((a, b) => (b.exercice ?? 0) - (a.exercice ?? 0))
            .slice(0, 5)
        );
        const comptableRapports = (Array.isArray(rapports) ? rapports : [])
          .filter(isRapportComptable)
          .sort((a, b) => new Date(b.date_generation) - new Date(a.date_generation))
          .slice(0, 5);
        setRecentRapports(comptableRapports);
      })
      .catch((err) =>
        setError(err.response?.data?.detail || 'Impossible de charger le tableau de bord')
      )
      .finally(() => setLoading(false));
  }, []);

  const amortColumns = [
    { key: 'id_immobilisation', label: 'Immobilisation' },
    {
      key: 'methode',
      label: 'Méthode',
      render: (r) => formatMethode(r.methode),
    },
    {
      key: 'montant_annuel',
      label: 'Dotation ($)',
      render: (r) => formatDollar(r.montant_annuel),
    },
    { key: 'exercice', label: 'Exercice' },
    {
      key: 'valeur_nette',
      label: 'VNC ($)',
      render: (r) => formatDollar(r.valeur_nette),
    },
  ];

  const rapportColumns = [
    { key: 'titre', label: 'Rapport' },
    {
      key: 'type_rapport',
      label: 'Type',
      render: (r) => formatRapportType(r.type_rapport),
    },
    {
      key: 'date_generation',
      label: 'Date',
      render: (r) => formatDate(r.date_generation),
    },
  ];

  return (
    <>
      <Header placeholder="Rechercher un bien, un rapport..." />
      <div className="flex-1 p-6">
        <PageHeader
          title="Tableau de bord comptable"
          description="Vue d'ensemble des immobilisations, amortissements et rapports financiers."
        />
        <AlertBanner message={error} onClose={() => setError(null)} />

        {loading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Immobilisations"
                value={stats?.total_immobilisations ?? '—'}
                hint={stats ? `${stats.immobilisations_actives} actives` : null}
                icon={Building2}
              />
              <StatCard
                label="Valeur totale d'acquisition"
                value={aggregates ? formatDollar(aggregates.valeurTotaleAcquisition) : '—'}
                icon={Building2}
                accent="blue"
              />
              <StatCard
                label="Amortissements calculés"
                value={aggregates?.nbAmortissements ?? '—'}
                icon={TrendingDown}
              />
              <StatCard
                label="Valeur nette comptable"
                value={aggregates ? formatDollar(aggregates.vncGlobale) : '—'}
                icon={TrendingDown}
                accent="emerald"
              />
              <StatCard
                label="Catégories"
                value={aggregates?.nbCategories ?? '—'}
                icon={FolderTree}
              />
              <StatCard
                label="Totalement amorties"
                value={aggregates?.totalementAmorties ?? '—'}
                icon={AlertTriangle}
                accent="amber"
              />
              <StatCard
                label="Proches de fin de vie"
                value={aggregates?.prochesFinVie ?? '—'}
                hint="Dans les 12 prochains mois"
                icon={AlertTriangle}
                accent="red"
              />
              <StatCard
                label="Amortissement cumulé"
                value={aggregates ? formatDollar(aggregates.amortissementCumule) : '—'}
                icon={FileText}
              />
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-900">Derniers amortissements</h2>
                  <Link to="/comptable/amortissements" className="text-sm font-medium text-blue-600 hover:underline">
                    Voir tout
                  </Link>
                </div>
                {recentAmort.length === 0 ? (
                  <EmptyState title="Aucun amortissement enregistré" />
                ) : (
                  <DataTable columns={amortColumns} data={recentAmort} rowKey="id_amortissement" />
                )}
              </div>

              <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-900">Rapports financiers récents</h2>
                  <Link to="/comptable/rapports" className="text-sm font-medium text-blue-600 hover:underline">
                    Voir tout
                  </Link>
                </div>
                {recentRapports.length === 0 ? (
                  <EmptyState title="Aucun rapport financier disponible" />
                ) : (
                  <DataTable columns={rapportColumns} data={recentRapports} rowKey="id_rapport" />
                )}
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Accès rapide</p>
              <div className="mt-3 flex flex-wrap gap-4 text-sm">
                <Link to="/comptable/immobilisations" className="font-medium text-blue-600 hover:underline">
                  Immobilisations
                </Link>
                <Link to="/comptable/categories-immobilisations" className="font-medium text-blue-600 hover:underline">
                  Catégories
                </Link>
                <Link to="/comptable/amortissements" className="font-medium text-blue-600 hover:underline">
                  Amortissements
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
