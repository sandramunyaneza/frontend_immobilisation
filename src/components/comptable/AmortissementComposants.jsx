import { Plus, Trash2 } from 'lucide-react';
import { FormField, inputClass } from '../ui/FormCard';
import { formatDollar } from '../../utils/format';
import { sumComposantValues } from '../../utils/amortissementCalc';

const emptyComposant = () => ({
  nom_composant: '',
  valeur_composant: '',
  duree_vie_composant: '',
});

export default function AmortissementComposants({
  composants,
  onChange,
  valeurAchatMax,
  totalError,
}) {
  const total = sumComposantValues(composants);

  const update = (index, field, value) => {
    const next = composants.map((c, i) =>
      i === index ? { ...c, [field]: value } : c
    );
    onChange(next);
  };

  const add = () => onChange([...composants, emptyComposant()]);

  const remove = (index) => {
    if (composants.length <= 1) return;
    onChange(composants.filter((_, i) => i !== index));
  };

  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 space-y-3">
      <h4 className="text-sm font-semibold text-slate-800">
        Composants de l&apos;immobilisation
      </h4>

      {composants.map((c, index) => (
        <div
          key={index}
          className="rounded-lg border border-slate-200 bg-white p-3 space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Composant {index + 1}
            </span>
            {composants.length > 1 && (
              <button
                type="button"
                onClick={() => remove(index)}
                className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                aria-label="Supprimer le composant"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
          <FormField label="Nom du composant">
            <input
              required
              className={inputClass}
              value={c.nom_composant}
              onChange={(e) => update(index, 'nom_composant', e.target.value)}
            />
          </FormField>
          <div className="grid grid-cols-2 gap-2">
            <FormField label="Valeur ($)">
              <input
                required
                type="number"
                min={0.01}
                step="0.01"
                className={inputClass}
                value={c.valeur_composant}
                onChange={(e) => update(index, 'valeur_composant', e.target.value)}
              />
            </FormField>
            <FormField label="Durée de vie (ans)">
              <input
                required
                type="number"
                min={1}
                className={inputClass}
                value={c.duree_vie_composant}
                onChange={(e) => update(index, 'duree_vie_composant', e.target.value)}
              />
            </FormField>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={add}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 py-2 text-sm font-medium text-slate-600 hover:border-slate-400 hover:bg-white"
      >
        <Plus className="h-4 w-4" /> Ajouter un composant
      </button>

      <p className="text-xs text-slate-500">
        Total des composants :{' '}
        <span className={totalError ? 'font-semibold text-red-600' : 'font-medium text-slate-700'}>
          {formatDollar(total)}
        </span>
        {valeurAchatMax != null && ` / ${formatDollar(valeurAchatMax)} max`}
      </p>
      {totalError && (
        <p className="text-xs text-red-600">{totalError}</p>
      )}
    </div>
  );
}

export { emptyComposant };
