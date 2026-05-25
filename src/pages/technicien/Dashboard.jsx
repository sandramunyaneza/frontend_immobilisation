import { AlertTriangle, Hammer, Package, Wrench } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardService } from '../../services/dashboard';
import { pannesService } from '../../services/pannes';
import { maintenancesService } from '../../services/maintenances';
import { reparationsService } from '../../services/reparations';
import { demandesPiecesService } from '../../services/demandesPieces';
import { immobilisationsService } from '../../services/immobilisations';
import {
  computeTechnicienAggregates,
  formatGravite,
  formatStatutPanne,
  formatTypeMaintenance,
  graviteVariant,
  statutPanneVariant,
} from '../../utils/technicienHelpers';
import { formatDate } from '../../utils/format';
import Header from '../../components/layout/Header';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import DataTable from '../../components/ui/DataTable';
import AlertBanner from '../../components/ui/AlertBanner';
import EmptyState from '../../components/ui/EmptyState';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Badge from '../../components/ui/Badge';

export default function TechnicienDashboard() {
  const [agg, setAgg] = useState(null);
  const [recentPannes, setRecentPannes] = useState([]);
  const [immoMap, setImmoMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      dashboardService.stats().catch(() => null),
      pannesService.list().catch(() => []),
      maintenancesService.list().catch(() => []),
      reparationsService.list().catch(() => []),
      demandesPiecesService.list().catch(() => []),
      immobilisationsService.list().catch(() => []),
    ])
      .then(([stats, pannes, mains, reps, demandes, immos]) => {
        const p = Array.isArray(pannes) ? pannes : [];
        const m = Array.isArray(mains) ? mains : [];
        const immobilisations = Array.isArray(immos) ? immos : [];
        const map = {};
        immobilisations.forEach((i) => {
          map[i.id_immobilisation] = i;
        });
        setImmoMap(map);
        setAgg(
          computeTechnicienAggregates({
            stats,
            pannes: p,
            maintenances: m,
            reparations: Array.isArray(reps) ? reps : [],
            demandes: Array.isArray(demandes) ? demandes : [],
            immobilisations,
          })
        );
        setRecentPannes(
          [...p]
            .sort((a, b) => new Date(b.date_panne) - new Date(a.date_panne))
            .slice(0, 5)
        );
      })
      .catch((err) =>
        setError(err.response?.data?.detail || 'Impossible de charger le tableau de bord')
      )
      .finally(() => setLoading(false));
  }, []);

  const panneColumns = [
    {
      key: 'immo',
      label: 'Équipement',
      render: (r) => immoMap[r.id_immobilisation]?.nom || `#${r.id_immobilisation}`,
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
    { key: 'date_panne', label: 'Date', render: (r) => formatDate(r.date_panne) },
  ];

  const prevColumns = [
    {
      key: 'immo',
      label: 'Équipement',
      render: (r) => immoMap[r.id_immobilisation]?.nom || `#${r.id_immobilisation}`,
    },
    {
      key: 'type',
      label: 'Type',
      render: (r) => formatTypeMaintenance(r.type_maintenance),
    },
    {
      key: 'date_planifiee',
      label: 'Date planifiée',
      render: (r) => formatDate(r.date_planifiee),
    },
  ];

  return (
    <>
      <Header placeholder="Rechercher une intervention..." />
      <div className="flex-1 p-6">
        <PageHeader
          title="Tableau de bord technicien"
          description="Suivi des pannes, maintenances, réparations et demandes de pièces."
        />
        <AlertBanner message={error} onClose={() => setError(null)} />

        {loading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        ) : agg ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Pannes déclarées"
                value={agg.pannesDeclarees}
                icon={AlertTriangle}
                accent="red"
              />
              <StatCard label="Pannes en cours" value={agg.pannesEnCours} accent="amber" />
              <StatCard label="Pannes résolues" value={agg.pannesResolues} accent="emerald" />
              <StatCard
                label="Maintenances planifiées"
                value={agg.maintPlanifiees}
                icon={Wrench}
              />
              <StatCard
                label="Maintenances en cours"
                value={agg.maintEnCours}
                icon={Wrench}
                accent="amber"
              />
              <StatCard label="Réparations enregistrées" value={agg.reparationsCount} icon={Hammer} />
              <StatCard
                label="Demandes en attente"
                value={agg.demandesEnAttente}
                icon={Package}
                accent="amber"
              />
              <StatCard
                label="Équipements en maintenance"
                value={agg.equipementsMaintenance}
                icon={AlertTriangle}
              />
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-900">Pannes récentes</h2>
                  <Link to="/technicien/pannes" className="text-sm font-medium text-blue-600 hover:underline">
                    Voir tout
                  </Link>
                </div>
                {recentPannes.length === 0 ? (
                  <EmptyState title="Aucune panne enregistrée" />
                ) : (
                  <DataTable columns={panneColumns} data={recentPannes} rowKey="id_panne" />
                )}
              </div>

              <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-900">Prochaines maintenances préventives</h2>
                  <Link
                    to="/technicien/maintenances"
                    className="text-sm font-medium text-blue-600 hover:underline"
                  >
                    Voir tout
                  </Link>
                </div>
                {agg.prochainesPreventives.length === 0 ? (
                  <EmptyState title="Aucune maintenance préventive planifiée" />
                ) : (
                  <DataTable
                    columns={prevColumns}
                    data={agg.prochainesPreventives}
                    rowKey="id_maintenance"
                  />
                )}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-4 text-sm">
              <Link to="/technicien/pannes" className="font-medium text-blue-600 hover:underline">
                Déclarer une panne
              </Link>
              <Link to="/technicien/maintenances" className="font-medium text-blue-600 hover:underline">
                Planifier une maintenance
              </Link>
              <Link to="/technicien/demandes-pieces" className="font-medium text-blue-600 hover:underline">
                Demander une pièce
              </Link>
            </div>
          </>
        ) : (
          <EmptyState title="Données indisponibles" />
        )}
      </div>
    </>
  );
}
