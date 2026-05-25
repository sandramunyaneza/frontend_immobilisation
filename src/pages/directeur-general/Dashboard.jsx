import { AlertTriangle, Building2, Gavel, Wrench } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardService } from '../../services/dashboard';
import { immobilisationsService } from '../../services/immobilisations';
import { maintenancesService } from '../../services/maintenances';
import { decisionsService } from '../../services/decisions';
import { rapportsService } from '../../services/rapports';
import { auditService } from '../../services/audit';
import { computeDirecteurAggregates } from '../../utils/directeurHelpers';
import { formatTypeDecision, formatStatutDecision } from '../../utils/directeurHelpers';
import { formatDollar, formatDate, formatRapportType } from '../../utils/format';
import Header from '../../components/layout/Header';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import DataTable from '../../components/ui/DataTable';
import AlertBanner from '../../components/ui/AlertBanner';
import EmptyState from '../../components/ui/EmptyState';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Badge from '../../components/ui/Badge';
import { statutDecisionVariant } from '../../utils/directeurHelpers';

export default function DirecteurDashboard() {
  const [agg, setAgg] = useState(null);
  const [decisionsRecent, setDecisionsRecent] = useState([]);
  const [rapportsRecent, setRapportsRecent] = useState([]);
  const [auditRecent, setAuditRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      dashboardService.stats().catch(() => null),
      immobilisationsService.list().catch(() => []),
      maintenancesService.list().catch(() => []),
      decisionsService.list().catch(() => []),
      rapportsService.list().catch(() => []),
      auditService.list().catch(() => []),
    ])
      .then(([stats, immos, mains, decisions, rapports, audit]) => {
        const immobilisations = Array.isArray(immos) ? immos : [];
        const maintenances = Array.isArray(mains) ? mains : [];
        const decs = Array.isArray(decisions) ? decisions : [];
        setAgg(
          computeDirecteurAggregates({ stats, immobilisations, maintenances, decisions: decs })
        );
        setDecisionsRecent(
          [...decs]
            .sort((a, b) => new Date(b.date_decision) - new Date(a.date_decision))
            .slice(0, 5)
        );
        setRapportsRecent(
          (Array.isArray(rapports) ? rapports : [])
            .sort((a, b) => new Date(b.date_generation) - new Date(a.date_generation))
            .slice(0, 5)
        );
        setAuditRecent(
          (Array.isArray(audit) ? audit : [])
            .sort((a, b) => new Date(b.date_action) - new Date(a.date_action))
            .slice(0, 5)
        );
      })
      .catch((err) =>
        setError(err.response?.data?.detail || 'Impossible de charger le tableau de bord')
      )
      .finally(() => setLoading(false));
  }, []);

  const decisionColumns = [
    { key: 'type_decision', label: 'Type', render: (r) => formatTypeDecision(r.type_decision) },
    {
      key: 'statut',
      label: 'Statut',
      render: (r) => (
        <Badge variant={statutDecisionVariant(r.statut)} dot>
          {formatStatutDecision(r.statut)}
        </Badge>
      ),
    },
    {
      key: 'montant_valide',
      label: 'Montant ($)',
      render: (r) => formatDollar(r.montant_valide),
    },
    { key: 'date_decision', label: 'Date', render: (r) => formatDate(r.date_decision) },
  ];

  const rapportColumns = [
    {
      key: 'titre',
      label: 'Rapport',
      render: (r) => r.titre || formatRapportType(r.type_rapport),
    },
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

  const auditColumns = [
    { key: 'action', label: 'Action' },
    { key: 'description', label: 'Description' },
    { key: 'entite_concernee', label: 'Entité' },
    {
      key: 'date_action',
      label: 'Date',
      render: (r) => formatDate(r.date_action),
    },
  ];

  return (
    <>
      <Header placeholder="Rechercher une décision, un rapport..." />
      <div className="flex-1 p-6">
        <PageHeader
          title="Tableau de bord décisionnel"
          description="Pilotage stratégique des immobilisations, budgets de maintenance et décisions."
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
                label="Valeur totale du parc"
                value={formatDollar(agg.valeurTotale)}
                icon={Building2}
              />
              <StatCard
                label="Immobilisations"
                value={agg.totalImmobilisations}
                hint={`${agg.actives} actives`}
                accent="emerald"
              />
              <StatCard
                label="Coût maintenances (prévu)"
                value={formatDollar(agg.coutMaintenances)}
                icon={Wrench}
                accent="amber"
              />
              <StatCard
                label="Maintenances en cours"
                value={agg.maintenancesEnCours}
                icon={Wrench}
              />
              <StatCard label="Décisions prises" value={agg.decisionsPrises} icon={Gavel} />
              <StatCard
                label="Décisions en attente"
                value={agg.decisionsEnAttente}
                hint={agg.budgetsEnAttente ? `${agg.budgetsEnAttente} budget(s)` : null}
                accent="amber"
              />
              <StatCard
                label="Biens critiques / fin de vie"
                value={agg.prochesFinVie}
                icon={AlertTriangle}
                accent="red"
              />
              <StatCard
                label="Alertes (stock / pannes)"
                value={`${agg.alertesStock} / ${agg.pannesOuvertes}`}
                hint="Stock faible · Pannes"
                accent="red"
              />
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-900">Décisions récentes</h2>
                  <Link
                    to="/directeur-general/decisions"
                    className="text-sm font-medium text-blue-600 hover:underline"
                  >
                    Voir tout
                  </Link>
                </div>
                {decisionsRecent.length === 0 ? (
                  <EmptyState title="Aucune décision enregistrée" />
                ) : (
                  <DataTable columns={decisionColumns} data={decisionsRecent} rowKey="id_decision" />
                )}
              </div>

              <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-900">Rapports récents</h2>
                  <Link
                    to="/directeur-general/rapports"
                    className="text-sm font-medium text-blue-600 hover:underline"
                  >
                    Voir tout
                  </Link>
                </div>
                {rapportsRecent.length === 0 ? (
                  <EmptyState title="Aucun rapport disponible" />
                ) : (
                  <DataTable columns={rapportColumns} data={rapportsRecent} rowKey="id_rapport" />
                )}
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Actions d&apos;audit importantes</h2>
                <Link
                  to="/directeur-general/audit"
                  className="text-sm font-medium text-blue-600 hover:underline"
                >
                  Journal complet
                </Link>
              </div>
              {auditRecent.length === 0 ? (
                <EmptyState title="Aucune activité d'audit" />
              ) : (
                <DataTable columns={auditColumns} data={auditRecent} rowKey="id_log" />
              )}
            </div>

            {(agg.horsService > 0 || agg.enMaintenance > 0) && (
              <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50/60 p-4">
                <p className="text-sm font-semibold text-amber-900">État du parc</p>
                <p className="mt-1 text-sm text-amber-800">
                  {agg.enMaintenance > 0 && `${agg.enMaintenance} immobilisation(s) en maintenance. `}
                  {agg.horsService > 0 && `${agg.horsService} hors service. `}
                  {agg.prochesFinVie > 0 && `${agg.prochesFinVie} proche(s) de fin de vie.`}
                </p>
              </div>
            )}
          </>
        ) : (
          <EmptyState title="Données indisponibles" />
        )}
      </div>
    </>
  );
}
