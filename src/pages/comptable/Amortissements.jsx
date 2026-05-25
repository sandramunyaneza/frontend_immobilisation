import { useMemo, useState } from 'react';
import { Calculator, Plus, TrendingDown } from 'lucide-react';
import useFetch from '../../hooks/useFetch';
import { amortissementsService } from '../../services/amortissements';
import { immobilisationsService } from '../../services/immobilisations';
import Header from '../../components/layout/Header';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import DataTable from '../../components/ui/DataTable';
import AlertBanner from '../../components/ui/AlertBanner';
import EmptyState from '../../components/ui/EmptyState';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Modal from '../../components/ui/Modal';
import FormCard, { FormField, inputClass } from '../../components/ui/FormCard';
import AmortissementComposants, { emptyComposant } from '../../components/comptable/AmortissementComposants';
import { formatDollar, formatDate, formatMethode } from '../../utils/format';
import { computeComptableAggregates } from '../../utils/comptableStats';
import {
  computeAmortissement,
  sumComposantValues,
  validateAmortissementForm,
} from '../../utils/amortissementCalc';
import ExportPdfButton from '../../components/ui/ExportPdfButton';
import { exportsService } from '../../services/exports';

const METHODES = [
  { value: 'LINEAIRE', label: 'Linéaire' },
  { value: 'DEGRESSIF', label: 'Dégressif' },
  { value: 'PAR_COMPOSANT', label: 'Par composant' },
];

const emptyForm = {
  id_immobilisation: '',
  methode: 'LINEAIRE',
  exercice: new Date().getFullYear(),
  date_calcul: new Date().toISOString().slice(0, 10),
};

const readOnlyInputClass =
  `${inputClass} cursor-not-allowed bg-slate-100 text-slate-700`;

export default function ComptableAmortissementsPage() {
  const [search, setSearch] = useState('');
  const [selectedImmoId, setSelectedImmoId] = useState(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [composants, setComposants] = useState([emptyComposant()]);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(null);

  const { data: amortissements, loading, error, setError, reload } = useFetch(
    () => amortissementsService.list(),
    []
  );
  const { data: immobilisations } = useFetch(() => immobilisationsService.list(), []);

  const aggregates = useMemo(
    () => computeComptableAggregates({ immobilisations, amortissements }),
    [immobilisations, amortissements]
  );

  const filteredImmos = useMemo(() => {
    if (!search) return immobilisations;
    const q = search.toLowerCase();
    return immobilisations.filter(
      (im) =>
        im.nom?.toLowerCase().includes(q) ||
        im.code_inventaire?.toLowerCase().includes(q)
    );
  }, [immobilisations, search]);

  const selectedImmo =
    immobilisations.find((im) => im.id_immobilisation === selectedImmoId) ||
    filteredImmos[0] ||
    null;

  const formImmo = useMemo(
    () =>
      immobilisations.find(
        (im) => String(im.id_immobilisation) === String(form.id_immobilisation)
      ) || null,
    [immobilisations, form.id_immobilisation]
  );

  const composantsTotalError = useMemo(() => {
    if (form.methode !== 'PAR_COMPOSANT' || !formImmo) return null;
    const total = sumComposantValues(composants);
    if (total > Number(formImmo.valeur_achat)) {
      return "Le total des composants ne peut pas dépasser la valeur d'achat de l'immobilisation.";
    }
    return null;
  }, [form.methode, formImmo, composants]);

  const calculated = useMemo(() => {
    if (!formImmo || composantsTotalError) return null;
    return computeAmortissement({
      methode: form.methode,
      immobilisation: formImmo,
      exercice: form.exercice,
      amortissements,
      composants: form.methode === 'PAR_COMPOSANT' ? composants : [],
    });
  }, [form.methode, form.exercice, formImmo, amortissements, composants, composantsTotalError]);

  const tableForImmo = useMemo(() => {
    if (!selectedImmo) return [];
    return amortissements
      .filter((a) => a.id_immobilisation === selectedImmo.id_immobilisation)
      .sort((a, b) => (a.exercice ?? 0) - (b.exercice ?? 0));
  }, [amortissements, selectedImmo]);

  const columns = [
    { key: 'exercice', label: 'Exercice' },
    {
      key: 'montant_annuel',
      label: 'Dotation ($)',
      render: (r) => <span className="font-medium text-blue-700">{formatDollar(r.montant_annuel)}</span>,
    },
    {
      key: 'cumul',
      label: 'Cumul ($)',
      render: (r) => formatDollar(r.cumul),
    },
    {
      key: 'valeur_nette',
      label: 'VNC ($)',
      render: (r) => formatDollar(r.valeur_nette),
    },
    {
      key: 'methode',
      label: 'Méthode',
      render: (r) => formatMethode(r.methode),
    },
    {
      key: 'date_calcul',
      label: 'Date calcul',
      render: (r) => formatDate(r.date_calcul),
    },
  ];

  const resetModal = () => {
    setForm(emptyForm);
    setComposants([emptyComposant()]);
  };

  const openCalcModal = () => {
    const id = selectedImmo?.id_immobilisation || '';
    setForm({
      ...emptyForm,
      id_immobilisation: id ? String(id) : '',
      exercice: new Date().getFullYear(),
    });
    setComposants([emptyComposant()]);
    setError(null);
    setSuccess(null);
    setOpen(true);
  };

  const handleMethodeChange = (methode) => {
    setForm((prev) => ({ ...prev, methode }));
    if (methode === 'PAR_COMPOSANT') {
      setComposants([emptyComposant()]);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const validationError = validateAmortissementForm({
      idImmobilisation: form.id_immobilisation,
      methode: form.methode,
      exercice: form.exercice,
      dateCalcul: form.date_calcul,
      immobilisation: formImmo,
      amortissements,
      composants: form.methode === 'PAR_COMPOSANT' ? composants : [],
    });

    if (validationError || composantsTotalError) {
      setError(validationError || composantsTotalError);
      return;
    }

    if (!calculated) {
      setError('Impossible de calculer les montants. Vérifiez les données saisies.');
      return;
    }

    setSaving(true);
    try {
      // Le backend n'accepte pas encore le détail des composants (pas de champ composants au POST).
      // Les dotations par composant sont agrégées dans montant_annuel, cumul et valeur_nette.
      await amortissementsService.create({
        id_immobilisation: Number(form.id_immobilisation),
        methode: form.methode,
        taux: calculated.taux,
        montant_annuel: calculated.montant_annuel,
        cumul: calculated.cumul,
        valeur_nette: calculated.valeur_nette,
        exercice: Number(form.exercice),
        date_calcul: form.date_calcul,
      });

      setSelectedImmoId(Number(form.id_immobilisation));
      setOpen(false);
      resetModal();
      setSuccess('Amortissement enregistré avec succès.');
      reload();
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(
        typeof detail === 'string'
          ? detail
          : Array.isArray(detail)
            ? detail.map((d) => d.msg || d).join(', ')
            : 'Erreur lors du calcul'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Header
        search={search}
        onSearch={setSearch}
        placeholder="Rechercher un bien..."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <ExportPdfButton onExport={exportsService.exportAmortissementsPdf} />
            <button
              type="button"
              onClick={openCalcModal}
              className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" /> Enregistrer un amortissement
            </button>
          </div>
        }
      />
      <div className="flex-1 p-6">
        <PageHeader
          title="Amortissements"
          description="Tableaux d'amortissement, dotations annuelles et valeur nette comptable."
        />
        <AlertBanner type="success" message={success} onClose={() => setSuccess(null)} />
        <AlertBanner message={error} onClose={() => setError(null)} />

        {!loading && amortissements.length > 0 && (
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Dotation annuelle (derniers calculs)"
              value={formatDollar(
                tableForImmo.length
                  ? tableForImmo[tableForImmo.length - 1]?.montant_annuel
                  : null
              )}
              icon={TrendingDown}
            />
            <StatCard
              label="Amortissement cumulé (sélection)"
              value={formatDollar(
                tableForImmo.length ? tableForImmo[tableForImmo.length - 1]?.cumul : null
              )}
            />
            <StatCard
              label="VNC globale"
              value={formatDollar(aggregates.vncGlobale)}
              accent="emerald"
            />
            <StatCard label="Calculs enregistrés" value={aggregates.nbAmortissements} icon={Calculator} />
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        ) : immobilisations.length === 0 ? (
          <EmptyState title="Aucune immobilisation — créez des biens avant de calculer les amortissements" />
        ) : (
          <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-900">
                Liste des biens ({filteredImmos.length})
              </p>
              {filteredImmos.map((im) => {
                const active = selectedImmo?.id_immobilisation === im.id_immobilisation;
                return (
                  <button
                    key={im.id_immobilisation}
                    type="button"
                    onClick={() => setSelectedImmoId(im.id_immobilisation)}
                    className={`w-full rounded-xl border p-3 text-left transition ${
                      active
                        ? 'border-blue-500 border-l-4 bg-blue-50/50'
                        : 'border-slate-100 bg-white hover:border-slate-200'
                    }`}
                  >
                    <p className="font-medium text-slate-900">{im.nom}</p>
                    <p className="text-xs text-slate-500">{im.code_inventaire || '—'}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-700">
                      {formatDollar(im.valeur_achat)}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="space-y-4">
              {selectedImmo && (
                <FormCard title={selectedImmo.nom} description={selectedImmo.code_inventaire || undefined}>
                  <dl className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="text-slate-500">Valeur d&apos;achat</dt>
                      <dd className="font-semibold">{formatDollar(selectedImmo.valeur_achat)}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Durée de vie</dt>
                      <dd>{selectedImmo.duree_vie} ans</dd>
                    </div>
                  </dl>
                </FormCard>
              )}

              <div>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-slate-900">Tableau d&apos;amortissement détaillé</h3>
                  {selectedImmo && (
                    <ExportPdfButton
                      label="PDF tableau"
                      onExport={() =>
                        exportsService.exportTableauAmortissementPdf(
                          selectedImmo.id_immobilisation
                        )
                      }
                    />
                  )}
                </div>
                {tableForImmo.length === 0 ? (
                  <EmptyState title="Aucun amortissement pour ce bien" />
                ) : (
                  <DataTable columns={columns} data={tableForImmo} rowKey="id_amortissement" />
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <Modal open={open} title="Enregistrer un amortissement" onClose={() => setOpen(false)}>
        <form onSubmit={handleCreate} className="space-y-4">
          <FormField label="Immobilisation">
            <select
              required
              className={inputClass}
              value={form.id_immobilisation}
              onChange={(e) => setForm({ ...form, id_immobilisation: e.target.value })}
            >
              <option value="">Choisir un bien</option>
              {immobilisations.map((im) => (
                <option key={im.id_immobilisation} value={im.id_immobilisation}>
                  {im.nom} ({im.code_inventaire || im.id_immobilisation})
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Méthode d'amortissement">
            <select
              required
              className={inputClass}
              value={form.methode}
              onChange={(e) => handleMethodeChange(e.target.value)}
            >
              {METHODES.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </FormField>

          <FormField label="Exercice">
            <input
              required
              type="number"
              className={inputClass}
              value={form.exercice}
              onChange={(e) => setForm({ ...form, exercice: e.target.value })}
            />
          </FormField>

          <FormField label="Date de calcul">
            <input
              required
              type="date"
              className={inputClass}
              value={form.date_calcul}
              onChange={(e) => setForm({ ...form, date_calcul: e.target.value })}
            />
          </FormField>

          {form.methode === 'PAR_COMPOSANT' && formImmo && (
            <AmortissementComposants
              composants={composants}
              onChange={setComposants}
              valeurAchatMax={formImmo.valeur_achat}
              totalError={composantsTotalError}
            />
          )}

          <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 space-y-3">
            <h4 className="text-sm font-semibold text-slate-800">Montants calculés</h4>
            <p className="text-xs text-slate-500">
              Calcul automatique selon la méthode, l&apos;exercice et les amortissements déjà enregistrés.
            </p>

            <FormField label="Taux (%)">
              <input
                readOnly
                tabIndex={-1}
                className={readOnlyInputClass}
                value={calculated?.taux != null ? calculated.taux : '—'}
              />
            </FormField>

            <FormField label="Montant annuel / dotation ($)">
              <input
                readOnly
                tabIndex={-1}
                className={readOnlyInputClass}
                value={calculated ? formatDollar(calculated.montant_annuel) : '—'}
              />
            </FormField>

            <FormField label="Cumul ($)">
              <input
                readOnly
                tabIndex={-1}
                className={readOnlyInputClass}
                value={calculated ? formatDollar(calculated.cumul) : '—'}
              />
            </FormField>

            <FormField label="Valeur nette comptable ($)">
              <input
                readOnly
                tabIndex={-1}
                className={readOnlyInputClass}
                value={calculated ? formatDollar(calculated.valeur_nette) : '—'}
              />
            </FormField>
          </div>

          <button
            type="submit"
            disabled={saving || !calculated || !!composantsTotalError}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 py-2.5 text-sm font-medium text-white disabled:opacity-60"
          >
            <Calculator className="h-4 w-4" />
            Enregistrer le calcul
          </button>
        </form>
      </Modal>
    </>
  );
}
