import { vehiculesService } from '../services/vehicules';
import { machinesService } from '../services/machines';
import { ordinateursService } from '../services/ordinateurs';

export const emptySpecificFields = {
  immatriculation: '',
  marque: '',
  modele: '',
  numero_chassis: '',
  puissance: '',
  type_machine: '',
  numero_serie: '',
  ram: '',
  processeur: '',
  disque_dur: '',
  systeme_exploitation: '',
};

const strOrNull = (v) => {
  const s = typeof v === 'string' ? v.trim() : v;
  return s ? s : null;
};

/** Indique si au moins un champ spécifique machine/ordinateur est renseigné. */
export function hasOptionalSpecificData(kind, fields) {
  if (kind === 'MACHINE') {
    return !!(fields.puissance?.trim() || fields.type_machine?.trim() || fields.numero_serie?.trim());
  }
  if (kind === 'ORDINATEUR') {
    return !!(
      fields.ram?.trim() ||
      fields.processeur?.trim() ||
      fields.disque_dur?.trim() ||
      fields.systeme_exploitation?.trim()
    );
  }
  return false;
}

/**
 * Charge les champs spécifiques existants pour une immobilisation (édition).
 * @returns {{ fields: typeof emptySpecificFields, ids: { vehicule: number|null, machine: number|null, ordinateur: number|null } }}
 */
export async function loadSpecificFieldsForImmo(idImmobilisation, kind) {
  const fields = { ...emptySpecificFields };
  const ids = { vehicule: null, machine: null, ordinateur: null };

  if (kind === 'VEHICULE') {
    try {
      const v = await vehiculesService.getByImmobilisation(idImmobilisation);
      ids.vehicule = v.id_vehicule;
      fields.immatriculation = v.immatriculation || '';
      fields.marque = v.marque || '';
      fields.modele = v.modele || '';
      fields.numero_chassis = v.numero_chassis || '';
    } catch {
      /* pas encore de fiche véhicule */
    }
  } else if (kind === 'MACHINE') {
    try {
      const m = await machinesService.getByImmobilisation(idImmobilisation);
      ids.machine = m.id_machine;
      fields.puissance = m.puissance || '';
      fields.type_machine = m.type_machine || '';
      fields.numero_serie = m.numero_serie || '';
    } catch {
      /* pas encore de fiche machine */
    }
  } else if (kind === 'ORDINATEUR') {
    try {
      const o = await ordinateursService.getByImmobilisation(idImmobilisation);
      ids.ordinateur = o.id_ordinateur;
      fields.ram = o.ram || '';
      fields.processeur = o.processeur || '';
      fields.disque_dur = o.disque_dur || '';
      fields.systeme_exploitation = o.systeme_exploitation || '';
    } catch {
      /* pas encore de fiche ordinateur */
    }
  }

  return { fields, ids };
}

/**
 * Crée ou met à jour le sous-type via POST/PUT /api/vehicules|machines|ordinateurs.
 */
export async function syncSubtypeForImmo(idImmobilisation, kind, fields, ids) {
  if (!kind) return;

  if (kind === 'VEHICULE') {
    const immatriculation = fields.immatriculation?.trim();
    if (!immatriculation) {
      throw new Error("L'immatriculation est obligatoire pour un véhicule.");
    }
    const payload = {
      immatriculation,
      marque: strOrNull(fields.marque),
      modele: strOrNull(fields.modele),
      numero_chassis: strOrNull(fields.numero_chassis),
    };
    if (ids.vehicule) {
      await vehiculesService.update(ids.vehicule, payload);
    } else {
      await vehiculesService.create({ id_immobilisation: idImmobilisation, ...payload });
    }
    return;
  }

  if (kind === 'MACHINE') {
    if (!ids.machine && !hasOptionalSpecificData('MACHINE', fields)) return;
    const payload = {
      puissance: strOrNull(fields.puissance),
      type_machine: strOrNull(fields.type_machine),
      numero_serie: strOrNull(fields.numero_serie),
    };
    if (ids.machine) {
      await machinesService.update(ids.machine, payload);
    } else {
      await machinesService.create({ id_immobilisation: idImmobilisation, ...payload });
    }
    return;
  }

  if (kind === 'ORDINATEUR') {
    if (!ids.ordinateur && !hasOptionalSpecificData('ORDINATEUR', fields)) return;
    const payload = {
      ram: strOrNull(fields.ram),
      processeur: strOrNull(fields.processeur),
      disque_dur: strOrNull(fields.disque_dur),
      systeme_exploitation: strOrNull(fields.systeme_exploitation),
    };
    if (ids.ordinateur) {
      await ordinateursService.update(ids.ordinateur, payload);
    } else {
      await ordinateursService.create({ id_immobilisation: idImmobilisation, ...payload });
    }
  }
}
