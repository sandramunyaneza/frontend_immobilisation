import {
  AlertTriangle,
  Building2,
  Key,
  Package,
  ScrollText,
  Shield,
  Users,
  Wrench,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardService } from '../services/dashboard';
import { auditService } from '../services/audit';
import { utilisateursService } from '../services/utilisateurs';
import { rolesService } from '../services/roles';
import { permissionsService } from '../services/permissions';
import AlertBanner from '../components/ui/AlertBanner';
import EmptyState from '../components/ui/EmptyState';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import PageHeader from '../components/ui/PageHeader';
import StatCard from '../components/ui/StatCard';
import DataTable from '../components/ui/DataTable';
import Header from '../components/layout/Header';

function OpsDashboard({ stats, audit }) {
  const auditColumns = [
    { key: 'action', label: 'Action' },
    { key: 'description', label: 'Description' },
    {
      key: 'date_action',
      label: 'Date',
      render: (r) => (r.date_action ? new Date(r.date_action).toLocaleString('fr-FR') : '—'),
    },
  ];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Immobilisations" value={stats.total_immobilisations} icon={Building2} />
        <StatCard label="Actives" value={stats.immobilisations_actives} icon={Users} hint="En service" accent="emerald" />
        <StatCard label="Pannes déclarées" value={stats.pannes_declarees} icon={AlertTriangle} accent="red" />
        <StatCard label="Maintenances en cours" value={stats.maintenances_en_cours} icon={Wrench} accent="amber" />
        <StatCard label="Stock faible" value={stats.pieces_stock_faible} icon={Package} />
        <StatCard label="Demandes en attente" value={stats.demandes_pieces_en_attente} icon={Package} accent="amber" />
        <StatCard label="Décisions DG" value={stats.decisions_prises} icon={Building2} />
      </div>
      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Activité récente</h2>
        </div>
        {audit.length === 0 ? (
          <EmptyState title="Aucune activité enregistrée" />
        ) : (
          <DataTable columns={auditColumns} data={audit} rowKey="id_log" />
        )}
      </div>
    </>
  );
}

function AdminDashboard({ stats, counts, audit, usersMap }) {
  const auditColumns = [
    { key: 'action', label: 'Action' },
    {
      key: 'id_utilisateur',
      label: 'Utilisateur',
      render: (r) => usersMap[r.id_utilisateur] || `ID ${r.id_utilisateur}`,
    },
    { key: 'description', label: 'Description' },
    { key: 'entite_concernee', label: 'Entité' },
    {
      key: 'date_action',
      label: 'Date',
      render: (r) => (r.date_action ? new Date(r.date_action).toLocaleString('fr-FR') : '—'),
    },
  ];

  const actifs = counts.utilisateurs.filter((u) => u.statut === 'ACTIF').length;
  const pctActifs = counts.utilisateurs.length
    ? `${Math.round((actifs / counts.utilisateurs.length) * 100)}% du total`
    : null;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Utilisateurs" value={counts.utilisateurs.length} icon={Users} hint={pctActifs} accent="emerald" />
        <StatCard label="Rôles configurés" value={counts.roles.length} icon={Shield} />
        <StatCard label="Permissions" value={counts.permissions.length} icon={Key} />
        <StatCard
          label="Immobilisations"
          value={stats?.total_immobilisations ?? '—'}
          icon={Building2}
          hint={stats ? `${stats.immobilisations_actives} actives` : null}
        />
        <StatCard label="Entrées d'audit" value={counts.auditTotal} icon={ScrollText} />
        <StatCard label="Pannes ouvertes" value={stats?.pannes_declarees ?? '—'} icon={AlertTriangle} accent="red" />
        <StatCard label="Maintenances" value={stats?.maintenances_en_cours ?? '—'} icon={Wrench} accent="amber" />
        <StatCard label="Alertes stock" value={stats?.pieces_stock_faible ?? '—'} icon={Package} accent="amber" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Activités récentes</h2>
            <Link to="/audit" className="text-sm font-medium text-blue-600 hover:underline">
              Voir tout
            </Link>
          </div>
          {audit.length === 0 ? (
            <EmptyState title="Aucune activité enregistrée" />
          ) : (
            <DataTable
              columns={auditColumns}
              data={audit}
              rowKey="id_log"
              footer={`Affichage de ${audit.length} activité${audit.length > 1 ? 's' : ''} récente${audit.length > 1 ? 's' : ''}`}
            />
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-red-200 bg-red-50/50 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-red-600">État du parc</p>
            <p className="mt-2 text-sm text-slate-700">
              {stats
                ? `${stats.pannes_declarees} panne(s) déclarée(s), ${stats.maintenances_en_cours} maintenance(s) en cours.`
                : 'Statistiques opérationnelles indisponibles.'}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Administration</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>
                <Link to="/utilisateurs" className="font-medium text-blue-600 hover:underline">
                  Gérer les utilisateurs
                </Link>
              </li>
              <li>
                <Link to="/roles" className="font-medium text-blue-600 hover:underline">
                  Configurer les rôles
                </Link>
              </li>
              <li>
                <Link to="/audit" className="font-medium text-blue-600 hover:underline">
                  Consulter le journal d&apos;audit
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}

export default function Dashboard() {
  const { role } = useAuth();
  const isAdmin = role === 'ADMINISTRATEUR';

  const [stats, setStats] = useState(null);
  const [audit, setAudit] = useState([]);
  const [counts, setCounts] = useState({
    utilisateurs: [],
    roles: [],
    permissions: [],
    auditTotal: 0,
  });
  const [usersMap, setUsersMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loaders = [dashboardService.stats().catch(() => null)];

    if (isAdmin) {
      loaders.push(
        utilisateursService.list().catch(() => []),
        rolesService.list().catch(() => []),
        permissionsService.list().catch(() => []),
        auditService.list().catch(() => [])
      );
    } else {
      loaders.push(auditService.list().catch(() => []));
    }

    Promise.all(loaders)
      .then((results) => {
        const [s, ...rest] = results;
        setStats(s);
        if (isAdmin) {
          const [users, rolesList, perms, auditList] = rest;
          const usersArr = Array.isArray(users) ? users : [];
          setCounts({
            utilisateurs: usersArr,
            roles: Array.isArray(rolesList) ? rolesList : [],
            permissions: Array.isArray(perms) ? perms : [],
            auditTotal: Array.isArray(auditList) ? auditList.length : 0,
          });
          const map = {};
          usersArr.forEach((u) => {
            map[u.id_user] = u.nom;
          });
          setUsersMap(map);
          setAudit(Array.isArray(auditList) ? auditList.slice(0, 5) : []);
        } else {
          const auditList = rest[0];
          setAudit(Array.isArray(auditList) ? auditList.slice(0, 5) : []);
        }
      })
      .catch((err) =>
        setError(err.response?.data?.detail || 'Impossible de charger le tableau de bord')
      )
      .finally(() => setLoading(false));
  }, [isAdmin]);

  return (
    <>
      <Header placeholder="Rechercher un actif, un utilisateur..." />
      <div className="flex-1 p-6">
        <PageHeader
          title="Tableau de bord"
          description={
            isAdmin
              ? "Vue d'ensemble de l'administration, des utilisateurs et du parc d'immobilisations."
              : "Aperçu global des immobilisations, maintenances et stock."
          }
        />
        <AlertBanner message={error} onClose={() => setError(null)} />

        {loading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        ) : isAdmin ? (
          <AdminDashboard stats={stats} counts={counts} audit={audit} usersMap={usersMap} />
        ) : stats ? (
          <OpsDashboard stats={stats} audit={audit} />
        ) : (
          <EmptyState title="Statistiques indisponibles" />
        )}
      </div>
    </>
  );
}
