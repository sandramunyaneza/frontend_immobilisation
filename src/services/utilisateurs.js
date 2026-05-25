import api from './api';
export const utilisateursService = {
  list: () => api.get('/utilisateurs').then((r) => r.data),
  get: (id) => api.get(`/utilisateurs/${id}`).then((r) => r.data),
  create: (data) => api.post('/utilisateurs', data).then((r) => r.data),
  update: (id, data) => api.put(`/utilisateurs/${id}`, data).then((r) => r.data),
  desactiver: (id) => api.patch(`/utilisateurs/${id}/desactiver`).then((r) => r.data),
};
