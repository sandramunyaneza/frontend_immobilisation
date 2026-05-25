import api from './api';
export const vehiculesService = {
  list: () => api.get('/vehicules').then((r) => r.data),
  create: (data) => api.post('/vehicules', data).then((r) => r.data),
  getByImmobilisation: (idImmobilisation) =>
    api.get(`/immobilisations/${idImmobilisation}/vehicule`).then((r) => r.data),
  update: (id, data) => api.put(`/vehicules/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/vehicules/${id}`),
};
