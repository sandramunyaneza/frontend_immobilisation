import { useMemo, useState } from 'react';
import { MoreVertical, Plus, Pencil, UserX } from 'lucide-react';
import useFetch from '../hooks/useFetch';
import { utilisateursService } from '../services/utilisateurs';
import { rolesService } from '../services/roles';
import Header from '../components/layout/Header';
import PageHeader from '../components/ui/PageHeader';
import AlertBanner from '../components/ui/AlertBanner';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import DataTable from '../components/ui/DataTable';
import StatCard from '../components/ui/StatCard';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Badge, { roleBadgeVariant, statutBadgeVariant } from '../components/ui/Badge';
import { FormField, inputClass } from '../components/ui/FormCard';
import { Users, Shield } from 'lucide-react';

function Avatar({ nom }) {
  const init = (nom || '?')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700">
      {init}
    </div>
  );
}

const emptyForm = { nom: '', email: '', mot_de_passe: '', id_role: '', telephone: '' };

export default function UtilisateursPage() {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [confirmDeactivate, setConfirmDeactivate] = useState(null);
  const [menuOpen, setMenuOpen] = useState(null);
  const [saving, setSaving] = useState(false);

  const { data, loading, error, setError, reload } = useFetch(() => utilisateursService.list(), []);
  const { data: roles } = useFetch(() => rolesService.list(), []);

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(
      (u) =>
        u.nom?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.role?.nom_role?.toLowerCase().includes(q)
    );
  }, [data, search]);

  const stats = useMemo(() => {
    const total = data.length;
    const actifs = data.filter((u) => u.statut === 'ACTIF').length;
    return { total, actifs, roles: roles.length };
  }, [data, roles.length]);

  const openCreate = () => {
    setEditUser(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (user) => {
    setEditUser(user);
    setForm({
      nom: user.nom || '',
      email: user.email || '',
      mot_de_passe: '',
      id_role: String(user.id_role || user.role?.id_role || ''),
      telephone: user.telephone || '',
    });
    setOpen(true);
    setMenuOpen(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        nom: form.nom,
        email: form.email,
        id_role: Number(form.id_role),
        telephone: form.telephone || null,
      };
      if (editUser) {
        const update = { ...payload };
        if (form.mot_de_passe) update.mot_de_passe = form.mot_de_passe;
        await utilisateursService.update(editUser.id_user, update);
      } else {
        await utilisateursService.create({ ...payload, mot_de_passe: form.mot_de_passe });
      }
      setOpen(false);
      setForm(emptyForm);
      reload();
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async () => {
    if (!confirmDeactivate) return;
    setSaving(true);
    try {
      await utilisateursService.desactiver(confirmDeactivate.id_user);
      setConfirmDeactivate(null);
      reload();
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors de la désactivation');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      key: 'nom',
      label: 'Nom & email',
      render: (r) => (
        <div className="flex items-center gap-3">
          <Avatar nom={r.nom} />
          <div>
            <p className="font-semibold text-slate-900">{r.nom}</p>
            <p className="text-xs text-slate-500">{r.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      label: 'Rôle',
      render: (r) => (
        <Badge variant={roleBadgeVariant(r.role?.nom_role)}>{r.role?.nom_role || '—'}</Badge>
      ),
    },
    {
      key: 'statut',
      label: 'Statut',
      render: (r) => (
        <Badge variant={statutBadgeVariant(r.statut)} dot>
          {r.statut}
        </Badge>
      ),
    },
    {
      key: 'updated_at',
      label: 'Dernière mise à jour',
      render: (r) =>
        r.updated_at ? new Date(r.updated_at).toLocaleString('fr-FR') : '—',
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (r) => (
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen(menuOpen === r.id_user ? null : r.id_user)}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
          {menuOpen === r.id_user && (
            <div className="absolute right-0 z-10 mt-1 w-40 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
              <button
                type="button"
                onClick={() => openEdit(r)}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                <Pencil className="h-3.5 w-3.5" /> Modifier
              </button>
              {r.statut === 'ACTIF' && (
                <button
                  type="button"
                  onClick={() => {
                    setConfirmDeactivate(r);
                    setMenuOpen(null);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <UserX className="h-3.5 w-3.5" /> Désactiver
                </button>
              )}
            </div>
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
        placeholder="Rechercher un utilisateur, un rôle..."
        action={
          <button
            type="button"
            onClick={openCreate}
            className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" /> Ajouter un utilisateur
          </button>
        }
      />
      <div className="flex-1 p-6">
        <PageHeader
          title="Gestion des utilisateurs"
          description="Gérez les accès, les rôles et surveillez l'activité des membres de votre organisation."
        />
        <AlertBanner message={error} onClose={() => setError(null)} />

        {!loading && data.length > 0 && (
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total utilisateurs" value={stats.total} icon={Users} />
            <StatCard
              label="Utilisateurs actifs"
              value={stats.actifs}
              hint={stats.total ? `${Math.round((stats.actifs / stats.total) * 100)}% du total` : null}
              accent="emerald"
            />
            <StatCard label="Rôles configurés" value={stats.roles} icon={Shield} />
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState title={search ? 'Aucun utilisateur trouvé' : 'Aucun utilisateur enregistré'} />
        ) : (
          <DataTable
            columns={columns}
            data={filtered}
            rowKey="id_user"
            footer={`Affichage de ${filtered.length} sur ${data.length} utilisateur${data.length > 1 ? 's' : ''}`}
          />
        )}
      </div>

      <Modal
        open={open}
        title={editUser ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
        onClose={() => setOpen(false)}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Nom">
            <input required className={inputClass} value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} />
          </FormField>
          <FormField label="Email">
            <input required type="email" className={inputClass} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </FormField>
          <FormField label="Téléphone">
            <input className={inputClass} value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} />
          </FormField>
          <FormField label={editUser ? 'Nouveau mot de passe (optionnel)' : 'Mot de passe'}>
            <input
              type="password"
              required={!editUser}
              minLength={6}
              className={inputClass}
              value={form.mot_de_passe}
              onChange={(e) => setForm({ ...form, mot_de_passe: e.target.value })}
            />
          </FormField>
          <FormField label="Rôle">
            <select required className={inputClass} value={form.id_role} onChange={(e) => setForm({ ...form, id_role: e.target.value })}>
              <option value="">Choisir un rôle</option>
              {roles.map((r) => (
                <option key={r.id_role} value={r.id_role}>
                  {r.nom_role}
                </option>
              ))}
            </select>
          </FormField>
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-slate-900 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {editUser ? 'Enregistrer' : 'Créer'}
          </button>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!confirmDeactivate}
        title="Désactiver l'utilisateur"
        message={`Confirmer la désactivation de ${confirmDeactivate?.nom} ?`}
        confirmLabel="Désactiver"
        onConfirm={handleDeactivate}
        onClose={() => setConfirmDeactivate(null)}
        loading={saving}
      />
    </>
  );
}
