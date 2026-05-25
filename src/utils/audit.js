/** Répartition des actions d'audit par type (création, modification, suppression) */
export function computeAuditDistribution(logs) {
  if (!logs?.length) return { modifications: 0, creations: 0, suppressions: 0 };

  let modifications = 0;
  let creations = 0;
  let suppressions = 0;

  for (const log of logs) {
    const a = (log.action || '').toLowerCase();
    if (/suppr|delete|retir/.test(a)) suppressions += 1;
    else if (/creer|create|ajout/.test(a)) creations += 1;
    else modifications += 1;
  }

  const total = logs.length;
  return {
    modifications: Math.round((modifications / total) * 100),
    creations: Math.round((creations / total) * 100),
    suppressions: Math.round((suppressions / total) * 100),
    criticalDeletes: suppressions,
  };
}

export function filterAuditLogs(logs, { search, module, userId }) {
  return logs.filter((log) => {
    if (module && log.entite_concernee !== module) return false;
    if (userId && String(log.id_utilisateur) !== String(userId)) return false;
    if (search) {
      const q = search.toLowerCase();
      const blob = `${log.action} ${log.description} ${log.entite_concernee} ${log.id_entite_concernee}`.toLowerCase();
      if (!blob.includes(q)) return false;
    }
    return true;
  });
}
