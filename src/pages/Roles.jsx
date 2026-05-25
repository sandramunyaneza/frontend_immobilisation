import { useEffect, useState } from 'react';
import { ChevronRight, Shield, Save } from 'lucide-react';
import useFetch from '../hooks/useFetch';
import { rolesService } from '../services/roles';
import { permissionsService } from '../services/permissions';
import Header from '../components/layout/Header';
import PageHeader from '../components/ui/PageHeader';
import AlertBanner from '../components/ui/AlertBanner';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import StatCard from '../components/ui/StatCard';
import Badge from '../components/ui/Badge';

export default function RolesPage() {
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [permState, setPermState] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const { data: roles, loading, error, setError, reload } = useFetch(() => rolesService.list(), []);
  const { data: allPermissions, loading: loadingPerms } = useFetch(() => permissionsService.list(), []);

  const filteredRoles = search
    ? roles.filter(
        (r) =>
          r.nom_role?.toLowerCase().includes(search.toLowerCase()) ||
          r.description?.toLowerCase().includes(search.toLowerCase())
      )
    : roles;

  const selected = roles.find((r) => r.id_role === selectedId) || filteredRoles[0] || null;

  useEffect(() => {
    if (filteredRoles.length && !selectedId) {
      setSelectedId(filteredRoles[0].id_role);
    }
  }, [filteredRoles, selectedId]);

  useEffect(() => {
    if (selected) {
      const ids = new Set((selected.permissions || []).map((p) => p.id_permission));
      const state = {};
      allPermissions.forEach((p) => {
        state[p.id_permission] = ids.has(p.id_permission);
      });
      setPermState(state);
    }
  }, [selected?.id_role, allPermissions]);

  const togglePerm = (id) => {
    setPermState((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    setSaveError(null);
    try {
      const permission_ids = Object.entries(permState)
        .filter(([, on]) => on)
        .map(([id]) => Number(id));
      await rolesService.update(selected.id_role, {
        nom_role: selected.nom_role,
        description: selected.description,
        permission_ids,
      });
      reload();
    } catch (err) {
      setSaveError(err.response?.data?.detail || 'Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const groupedPerms = allPermissions.reduce((acc, p) => {
    const prefix = (p.code_permission || '').split('_')[0] || 'AUTRE';
    if (!acc[prefix]) acc[prefix] = [];
    acc[prefix].push(p);
    return acc;
  }, {});

  return (
    <>
      <Header
        search={search}
        onSearch={setSearch}
        placeholder="Rechercher des rôles ou permissions..."
      />
      <div className="flex-1 p-6">
        <PageHeader
          title="Gestion des rôles"
          description="Consultez et configurez les rôles et leurs permissions associées."
        />
        <AlertBanner message={error || saveError} onClose={() => { setError(null); setSaveError(null); }} />

        {loading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        ) : roles.length === 0 ? (
          <EmptyState title="Aucun rôle configuré" />
        ) : (
          <>
            <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <StatCard label="Rôles définis" value={roles.length} icon={Shield} />
            </div>

            <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
              <div className="space-y-2">
                <h2 className="text-sm font-semibold text-slate-900">Rôles existants</h2>
                {filteredRoles.map((role) => {
                  const active = selected?.id_role === role.id_role;
                  return (
                    <button
                      key={role.id_role}
                      type="button"
                      onClick={() => setSelectedId(role.id_role)}
                      className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left transition ${
                        active
                          ? 'border-slate-900 bg-white shadow-sm'
                          : 'border-slate-100 bg-white hover:border-slate-200'
                      }`}
                    >
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                          active ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <Shield className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-900">{role.nom_role}</p>
                        <p className="truncate text-xs text-slate-500">{role.description || '—'}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
                    </button>
                  );
                })}
              </div>

              <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                {selected ? (
                  <>
                    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-lg font-bold text-slate-900">
                            Permissions : {selected.nom_role}
                          </h2>
                          <Badge variant="info">SYSTÈME</Badge>
                        </div>
                        <p className="mt-1 text-sm text-slate-500">{selected.description || '—'}</p>
                      </div>
                      <button
                        type="button"
                        disabled={saving || loadingPerms}
                        onClick={handleSave}
                        className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
                      >
                        <Save className="h-4 w-4" />
                        Enregistrer
                      </button>
                    </div>

                    {loadingPerms ? (
                      <LoadingSpinner />
                    ) : allPermissions.length === 0 ? (
                      <EmptyState title="Aucune permission disponible" />
                    ) : (
                      <div className="space-y-6">
                        {Object.entries(groupedPerms).map(([group, perms]) => (
                          <div key={group}>
                            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                              {group}
                            </h3>
                            <div className="grid gap-3 sm:grid-cols-2">
                              {perms.map((p) => (
                                <label
                                  key={p.id_permission}
                                  className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-slate-100 p-4 hover:bg-slate-50/50"
                                >
                                  <div className="min-w-0">
                                    <p className="text-sm font-semibold text-slate-900">{p.code_permission}</p>
                                    <p className="text-xs text-slate-500">{p.description || '—'}</p>
                                  </div>
                                  <input
                                    type="checkbox"
                                    checked={!!permState[p.id_permission]}
                                    onChange={() => togglePerm(p.id_permission)}
                                    className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                  />
                                </label>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <EmptyState title="Sélectionnez un rôle" />
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
