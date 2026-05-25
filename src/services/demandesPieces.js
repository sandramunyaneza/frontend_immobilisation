import api from './api';
export const demandesPiecesService = {
  list: () => api.get('/demandes-pieces').then((r) => r.data),
  create: (data) => api.post('/demandes-pieces', data).then((r) => r.data),
  updateStatut: (id, statut) =>
    api.patch(`/demandes-pieces/${id}/statut`, { statut }).then((r) => r.data),
};
