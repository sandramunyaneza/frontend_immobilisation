import api from './api';
export const immobilisationsService = {
  list: () => api.get('/immobilisations').then((r) => r.data),
  get: (id) => api.get(`/immobilisations/${id}`).then((r) => r.data),
  create: (data) => api.post('/immobilisations', data).then((r) => r.data),
  update: (id, data) => api.put(`/immobilisations/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/immobilisations/${id}`),
  updateStatut: (id, statut) =>
    api.patch(`/immobilisations/${id}/statut`, { statut }).then((r) => r.data),
};
