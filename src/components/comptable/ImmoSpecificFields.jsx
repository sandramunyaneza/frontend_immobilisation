import { FormField, inputClass } from '../ui/FormCard';
import { getSpecificFieldsTitle } from '../../utils/categoryKind';

/**
 * Champs spécifiques affichés selon la catégorie (véhicule, machine, ordinateur).
 */
export default function ImmoSpecificFields({ kind, values, onChange }) {
  if (!kind) return null;

  const title = getSpecificFieldsTitle(kind);
  const set = (field, value) => onChange({ ...values, [field]: value });

  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 space-y-3">
      <h4 className="text-sm font-semibold text-slate-800">{title}</h4>

      {kind === 'VEHICULE' && (
        <>
          <FormField label="Immatriculation">
            <input
              required
              className={inputClass}
              value={values.immatriculation}
              onChange={(e) => set('immatriculation', e.target.value)}
            />
          </FormField>
          <FormField label="Marque">
            <input
              className={inputClass}
              value={values.marque}
              onChange={(e) => set('marque', e.target.value)}
            />
          </FormField>
          <FormField label="Modèle">
            <input
              className={inputClass}
              value={values.modele}
              onChange={(e) => set('modele', e.target.value)}
            />
          </FormField>
          <FormField label="Numéro de châssis">
            <input
              className={inputClass}
              value={values.numero_chassis}
              onChange={(e) => set('numero_chassis', e.target.value)}
            />
          </FormField>
        </>
      )}

      {kind === 'MACHINE' && (
        <>
          <FormField label="Puissance">
            <input
              className={inputClass}
              value={values.puissance}
              onChange={(e) => set('puissance', e.target.value)}
            />
          </FormField>
          <FormField label="Type de machine">
            <input
              className={inputClass}
              value={values.type_machine}
              onChange={(e) => set('type_machine', e.target.value)}
            />
          </FormField>
          <FormField label="Numéro de série">
            <input
              className={inputClass}
              value={values.numero_serie}
              onChange={(e) => set('numero_serie', e.target.value)}
            />
          </FormField>
        </>
      )}

      {kind === 'ORDINATEUR' && (
        <>
          <FormField label="RAM">
            <input
              className={inputClass}
              value={values.ram}
              onChange={(e) => set('ram', e.target.value)}
            />
          </FormField>
          <FormField label="Processeur">
            <input
              className={inputClass}
              value={values.processeur}
              onChange={(e) => set('processeur', e.target.value)}
            />
          </FormField>
          <FormField label="Disque dur">
            <input
              className={inputClass}
              value={values.disque_dur}
              onChange={(e) => set('disque_dur', e.target.value)}
            />
          </FormField>
          <FormField label="Système d'exploitation">
            <input
              className={inputClass}
              value={values.systeme_exploitation}
              onChange={(e) => set('systeme_exploitation', e.target.value)}
            />
          </FormField>
        </>
      )}
    </div>
  );
}
