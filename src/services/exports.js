import api from './api';

/**
 * Télécharge un PDF depuis l'API exports (JWT via intercepteur api).
 */
async function downloadExport(path, fallbackFilename) {
  const response = await api.get(path, { responseType: 'blob' });
  const disposition = response.headers['content-disposition'];
  let filename = fallbackFilename;
  if (disposition) {
    const match = /filename="?([^";\n]+)"?/i.exec(disposition);
    if (match?.[1]) filename = match[1];
  }
  const blob = new Blob([response.data], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export const exportsService = {
  exportImmobilisationsPdf: () =>
    downloadExport('/exports/immobilisations/pdf', 'etat_immobilisations.pdf'),

  exportAmortissementsPdf: () =>
    downloadExport('/exports/amortissements/pdf', 'etat_amortissements.pdf'),

  exportTableauAmortissementPdf: (idImmobilisation) =>
    downloadExport(
      `/exports/amortissements/${idImmobilisation}/pdf`,
      `tableau_amortissement_${idImmobilisation}.pdf`
    ),

  exportPannesPdf: () => downloadExport('/exports/pannes/pdf', 'etat_pannes.pdf'),

  exportMaintenancesPdf: () =>
    downloadExport('/exports/maintenances/pdf', 'etat_maintenances.pdf'),

  exportReparationsPdf: () =>
    downloadExport('/exports/reparations/pdf', 'etat_reparations.pdf'),

  exportStockPdf: () => downloadExport('/exports/stock/pdf', 'etat_stock.pdf'),

  exportMouvementsStockPdf: () =>
    downloadExport('/exports/mouvements-stock/pdf', 'etat_mouvements_stock.pdf'),

  exportDemandesPiecesPdf: () =>
    downloadExport('/exports/demandes-pieces/pdf', 'etat_demandes_pieces.pdf'),

  exportDecisionsPdf: () =>
    downloadExport('/exports/decisions/pdf', 'etat_decisions.pdf'),

  exportAuditPdf: () => downloadExport('/exports/audit/pdf', 'journal_audit.pdf'),

  exportRapportGlobalPdf: () =>
    downloadExport('/exports/rapport-global/pdf', 'rapport_global_immobilisations.pdf'),
};

// Alias demandés dans le cahier des charges
export const exportImmobilisationsPdf = exportsService.exportImmobilisationsPdf;
export const exportAmortissementsPdf = exportsService.exportAmortissementsPdf;
export const exportTableauAmortissementPdf = exportsService.exportTableauAmortissementPdf;
export const exportPannesPdf = exportsService.exportPannesPdf;
export const exportMaintenancesPdf = exportsService.exportMaintenancesPdf;
export const exportReparationsPdf = exportsService.exportReparationsPdf;
export const exportStockPdf = exportsService.exportStockPdf;
export const exportMouvementsStockPdf = exportsService.exportMouvementsStockPdf;
export const exportDemandesPiecesPdf = exportsService.exportDemandesPiecesPdf;
export const exportDecisionsPdf = exportsService.exportDecisionsPdf;
export const exportAuditPdf = exportsService.exportAuditPdf;
export const exportRapportGlobalPdf = exportsService.exportRapportGlobalPdf;
