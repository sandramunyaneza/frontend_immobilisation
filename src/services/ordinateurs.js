import api from './api';
export const ordinateursService = {
  list: () => api.get('/ordinateurs').then((r) => r.data),
  create: (data) => api.post('/ordinateurs', data).then((r) => r.data),
  getByImmobilisation: (idImmobilisation) =>
    api.get(`/immobilisations/${idImmobilisation}/ordinateur`).then((r) => r.data),
  update: (id, data) => api.put(`/ordinateurs/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/ordinateurs/${id}`),
};
