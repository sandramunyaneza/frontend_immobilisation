import api from './api';
export const machinesService = {
  list: () => api.get('/machines').then((r) => r.data),
  create: (data) => api.post('/machines', data).then((r) => r.data),
  getByImmobilisation: (idImmobilisation) =>
    api.get(`/immobilisations/${idImmobilisation}/machine`).then((r) => r.data),
  update: (id, data) => api.put(`/machines/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/machines/${id}`),
};
