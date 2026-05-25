import { useMemo, useState } from 'react';
import { Building2, MoreVertical, Pencil, Plus } from 'lucide-react';
import useFetch from '../../hooks/useFetch';
import { immobilisationsService } from '../../services/immobilisations';
import { categoriesImmobilisationsService } from '../../services/categoriesImmobilisations';
import { amortissementsService } from '../../services/amortissements';
import Header from '../../components/layout/Header';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import AlertBanner from '../../components/ui/AlertBanner';
import EmptyState from '../../components/ui/EmptyState';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Modal from '../../components/ui/Modal';
import Badge, { statutBadgeVariant } from '../../components/ui/Badge';
import { FormField, inputClass } from '../../components/ui/FormCard';
import { formatDollar, formatDate, formatEtat, formatStatutImmo } from '../../utils/format';
import {
  BACKEND_GENERATES_INVENTORY_CODE,
  generateCodeInventaire,
} from '../../utils/inventoryCode';
import { deriveTypeImmobilisationFromCategory } from '../../utils/categoryType';
import { getCategoryKind } from '../../utils/categoryKind';
import ImmoSpecificFields from '../../components/comptable/ImmoSpecificFields';
import {
  emptySpecificFields,
  loadSpecificFieldsForImmo,
  syncSubtypeForImmo,
} from '../../utils/immoSubtype';
import ExportPdfButton from '../../components/ui/ExportPdfButton';
import { exportsService } from '../../services/exports';

const defaultForm = {
  nom: '',
  code_inventaire: '',
  description: '',
  date_acquisition: '',
  valeur_achat: '',
  duree_vie: '',
  etat: 'BON',
  id_categorie: '',
};

const ETATS = ['BON', 'MOYEN', 'MAUVAIS', 'HORS_SERVICE'];

export default function ComptableImmobilisationsPage() {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [selectedId, setSelectedId] = useState(null);
  const [menuOpen, setMenuOpen] = useState(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(null);
  const [loadingSubtype, setLoadingSubtype] = useState(false);
  const [specificFields, setSpecificFields] = useState(emptySpecificFields);
  const [subtypeIds, setSubtypeIds] = useState({
    vehicule: null,
    machine: null,
    ordinateur: null,
  });

  const { data, loading, error, setError, reload } = useFetch(
    () => immobilisationsService.list(),
    []
  );
  const { data: categories } = useFetch(() => categoriesImmobilisationsService.list(), []);
  const { data: amortissements } = useFetch(() => amortissementsService.list(), []);

  const categoryMap = useMemo(() => {
    const m = {};
    categories.forEach((c) => {
      m[c.id_categorie] = c.nom_categorie;
    });
    return m;
  }, [categories]);

  const vncByImmo = useMemo(() => {
    const latest = {};
    amortissements.forEach((a) => {
      const id = a.id_immobilisation;
      if (!latest[id] || (a.exercice ?? 0) >= (latest[id].exercice ?? 0)) {
        latest[id] = a.valeur_nette;
      }
    });
    return latest;
  }, [amortissements]);

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(
      (im) =>
        im.nom?.toLowerCase().includes(q) ||
        im.code_inventaire?.toLowerCase().includes(q) ||
        categoryMap[im.id_categorie]?.toLowerCase().includes(q)
    );
  }, [data, search, categoryMap]);

  const selected = filtered.find((im) => im.id_immobilisation === selectedId) || filtered[0] || null;

  const selectedCategory = useMemo(
    () => categories.find((c) => String(c.id_categorie) === String(form.id_categorie)),
    [categories, form.id_categorie]
  );

  const categoryKind = useMemo(
    () => (selectedCategory ? getCategoryKind(selectedCategory.nom_categorie) : null),
    [selectedCategory]
  );

  const resetSpecificState = () => {
    setSpecificFields({ ...emptySpecificFields });
    setSubtypeIds({ vehicule: null, machine: null, ordinateur: null });
  };

  const openCreate = () => {
    setEditItem(null);
    setForm(defaultForm);
    resetSpecificState();
    setOpen(true);
  };

  const openEdit = async (im) => {
    setEditItem(im);
    setForm({
      nom: im.nom || '',
      code_inventaire: im.code_inventaire || '',
      description: im.description || '',
      date_acquisition: im.date_acquisition || '',
      valeur_achat: String(im.valeur_achat ?? ''),
      duree_vie: String(im.duree_vie ?? ''),
      etat: im.etat || 'BON',
      id_categorie: String(im.id_categorie || ''),
    });
    resetSpecificState();
    setOpen(true);
    setMenuOpen(null);

    const catName = categoryMap[im.id_categorie];
    const kind = getCategoryKind(catName);
    if (!kind) return;

    setLoadingSubtype(true);
    try {
      const { fields, ids } = await loadSpecificFieldsForImmo(im.id_immobilisation, kind);
      setSpecificFields(fields);
      setSubtypeIds(ids);
    } finally {
      setLoadingSubtype(false);
    }
  };

  const handleCategoryChange = (idCategorie) => {
    setForm((prev) => ({ ...prev, id_categorie: idCategorie }));
    resetSpecificState();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    const categoryName = selectedCategory?.nom_categorie;

    if (categoryKind === 'VEHICULE' && !specificFields.immatriculation?.trim()) {
      setError("L'immatriculation est obligatoire pour un véhicule.");
      setSaving(false);
      return;
    }

    const manualCode = form.code_inventaire?.trim() || '';
    let codeInventaire = manualCode || null;

    if (!editItem && !codeInventaire && !BACKEND_GENERATES_INVENTORY_CODE) {
      codeInventaire = generateCodeInventaire({
        categoryName,
        acquisitionDate: form.date_acquisition,
        existingImmobilisations: data,
      });
    }

    const payload = {
      nom: form.nom,
      code_inventaire: codeInventaire,
      description: form.description || null,
      date_acquisition: form.date_acquisition,
      valeur_achat: Number(form.valeur_achat),
      duree_vie: Number(form.duree_vie),
      etat: form.etat,
      id_categorie: Number(form.id_categorie),
      type_immobilisation: deriveTypeImmobilisationFromCategory(categoryName),
    };

    const isEdit = Boolean(editItem);

    try {
      let idImmo;
      if (isEdit) {
        const updated = await immobilisationsService.update(editItem.id_immobilisation, payload);
        idImmo = updated.id_immobilisation;
      } else {
        const created = await immobilisationsService.create(payload);
        idImmo = created.id_immobilisation;
      }

      await syncSubtypeForImmo(idImmo, categoryKind, specificFields, subtypeIds);

      setOpen(false);
      setForm(defaultForm);
      resetSpecificState();
      setEditItem(null);
      setSuccess(
        isEdit
          ? 'Immobilisation mise à jour avec succès.'
          : 'Immobilisation créée avec succès.'
      );
      reload();
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(
        typeof detail === 'string'
          ? detail
          : Array.isArray(detail)
            ? detail.map((d) => d.msg || d).join(', ')
            : err.message || 'Erreur enregistrement'
      );
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { key: 'code_inventaire', label: 'Code inventaire' },
    {
      key: 'nom',
      label: 'Nom du bien',
      render: (r) => <span className="font-medium text-slate-900">{r.nom}</span>,
    },
    {
      key: 'id_categorie',
      label: 'Catégorie',
      render: (r) => categoryMap[r.id_categorie] || '—',
    },
    {
      key: 'date_acquisition',
      label: 'Acquisition',
      render: (r) => formatDate(r.date_acquisition),
    },
    {
      key: 'valeur_achat',
      label: 'Valeur achat ($)',
      render: (r) => formatDollar(r.valeur_achat),
    },
    {
      key: 'vnc',
      label: 'VNC ($)',
      render: (r) =>
        vncByImmo[r.id_immobilisation] != null
          ? formatDollar(vncByImmo[r.id_immobilisation])
          : formatDollar(r.valeur_achat),
    },
    {
      key: 'statut',
      label: 'Statut',
      render: (r) => (
        <Badge variant={statutBadgeVariant(r.statut)} dot>
          {formatStatutImmo(r.statut)}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (r) => (
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen(menuOpen === r.id_immobilisation ? null : r.id_immobilisation)}
            className="rounded p-1 hover:bg-slate-100"
          >
            <MoreVertical className="h-4 w-4 text-slate-500" />
          </button>
          {menuOpen === r.id_immobilisation && (
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
        placeholder="Rechercher une immobilisation..."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <ExportPdfButton onExport={exportsService.exportImmobilisationsPdf} />
            <button
              type="button"
              onClick={openCreate}
              className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" /> Nouvelle immobilisation
            </button>
          </div>
        }
      />
      <div className="flex-1 p-6">
        <PageHeader
          title="Immobilisations"
          description="Gérez et suivez l'ensemble de votre parc d'actifs immobilisés."
        />
        <AlertBanner type="success" message={success} onClose={() => setSuccess(null)} />
        <AlertBanner message={error} onClose={() => setError(null)} />

        {loading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState title={search ? 'Aucune immobilisation trouvée' : 'Aucune immobilisation enregistrée'} />
        ) : (
          <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
            <DataTable
              columns={columns}
              data={filtered}
              rowKey="id_immobilisation"
              footer={`Affichage de ${filtered.length} sur ${data.length} immobilisation${data.length > 1 ? 's' : ''}`}
            />

            {selected && (
              <aside className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900">Fiche détaillée</h3>
                <div className="mt-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                  <Building2 className="h-6 w-6" />
                </div>
                <p className="mt-3 text-lg font-semibold text-slate-900">{selected.nom}</p>
                <p className="text-sm text-blue-600">{selected.code_inventaire || '—'}</p>
                <dl className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between border-b border-slate-50 py-2">
                    <dt className="text-slate-500">Catégorie</dt>
                    <dd className="font-medium">{categoryMap[selected.id_categorie] || '—'}</dd>
                  </div>
                  <div className="flex justify-between border-b border-slate-50 py-2">
                    <dt className="text-slate-500">Valeur d'achat</dt>
                    <dd className="font-semibold">{formatDollar(selected.valeur_achat)}</dd>
                  </div>
                  <div className="flex justify-between border-b border-slate-50 py-2">
                    <dt className="text-slate-500">VNC</dt>
                    <dd>
                      {vncByImmo[selected.id_immobilisation] != null
                        ? formatDollar(vncByImmo[selected.id_immobilisation])
                        : formatDollar(selected.valeur_achat)}
                    </dd>
                  </div>
                  <div className="flex justify-between border-b border-slate-50 py-2">
                    <dt className="text-slate-500">Durée de vie</dt>
                    <dd>{selected.duree_vie ? `${selected.duree_vie} ans` : '—'}</dd>
                  </div>
                  <div className="flex justify-between border-b border-slate-50 py-2">
                    <dt className="text-slate-500">État</dt>
                    <dd>{formatEtat(selected.etat)}</dd>
                  </div>
                  <div className="flex justify-between py-2">
                    <dt className="text-slate-500">Acquisition</dt>
                    <dd>{formatDate(selected.date_acquisition)}</dd>
                  </div>
                </dl>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedId(selected.id_immobilisation);
                    openEdit(selected);
                  }}
                  className="mt-4 w-full rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Modifier
                </button>
              </aside>
            )}
          </div>
        )}
      </div>

      <Modal
        open={open}
        title={editItem ? 'Modifier l\'immobilisation' : 'Nouvelle immobilisation'}
        onClose={() => setOpen(false)}
      >
        <form onSubmit={handleSubmit} autoComplete="off" className="max-h-[70vh] space-y-3 overflow-y-auto">
          <FormField label="Nom">
            <input
              id="immo-nom"
              name="nom"
              required
              autoComplete="off"
              className={inputClass}
              value={form.nom}
              onChange={(e) => setForm({ ...form, nom: e.target.value })}
            />
          </FormField>
          <FormField label="Code inventaire">
            <input
              id="immo-code-inventaire"
              name="code_inventaire"
              autoComplete="off"
              className={inputClass}
              value={form.code_inventaire}
              onChange={(e) => setForm({ ...form, code_inventaire: e.target.value })}
              placeholder={editItem ? undefined : 'Ex. ORD-2026-001 (optionnel)'}
            />
            {!editItem && (
              <p className="mt-1 text-xs text-slate-500">
                Laissez vide pour générer automatiquement le code inventaire.
              </p>
            )}
          </FormField>
          <FormField label="Description">
            <textarea
              id="immo-description"
              name="description"
              className={inputClass}
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </FormField>
          <FormField label="Date d'acquisition">
            <input
              id="immo-date-acquisition"
              name="date_acquisition"
              required
              type="date"
              className={inputClass}
              value={form.date_acquisition}
              onChange={(e) => setForm({ ...form, date_acquisition: e.target.value })}
            />
          </FormField>
          <FormField label="Valeur d'achat ($)">
            <input
              id="immo-valeur-achat"
              name="valeur_achat"
              required
              type="number"
              step="0.01"
              min={0}
              inputMode="decimal"
              autoComplete="off"
              className={inputClass}
              value={form.valeur_achat}
              onChange={(e) => setForm({ ...form, valeur_achat: e.target.value })}
            />
          </FormField>
          <FormField label="Durée de vie (années)">
            <input
              id="immo-duree-vie"
              name="duree_vie"
              required
              type="number"
              min={1}
              autoComplete="off"
              className={inputClass}
              value={form.duree_vie}
              onChange={(e) => setForm({ ...form, duree_vie: e.target.value })}
            />
          </FormField>
          <FormField label="État">
            <select
              id="immo-etat"
              name="etat"
              className={inputClass}
              value={form.etat}
              onChange={(e) => setForm({ ...form, etat: e.target.value })}
            >
              {ETATS.map((t) => (
                <option key={t} value={t}>{formatEtat(t)}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Catégorie">
            <select
              id="immo-categorie"
              name="id_categorie"
              required
              className={inputClass}
              value={form.id_categorie}
              onChange={(e) => handleCategoryChange(e.target.value)}
            >
              <option value="">Choisir une catégorie</option>
              {categories.map((c) => (
                <option key={c.id_categorie} value={c.id_categorie}>{c.nom_categorie}</option>
              ))}
            </select>
          </FormField>

          {loadingSubtype ? (
            <div className="flex justify-center py-4">
              <LoadingSpinner />
            </div>
          ) : (
            <ImmoSpecificFields
              kind={categoryKind}
              values={specificFields}
              onChange={setSpecificFields}
            />
          )}

          <button type="submit" disabled={saving || loadingSubtype} className="w-full rounded-lg bg-slate-900 py-2.5 text-sm font-medium text-white disabled:opacity-60">
            {editItem ? 'Enregistrer' : 'Créer'}
          </button>
        </form>
      </Modal>
    </>
  );
}
