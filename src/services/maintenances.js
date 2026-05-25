import api from './api';
export const maintenancesService = {
  list: () => api.get('/maintenances').then((r) => r.data),
  create: (data) => api.post('/maintenances', data).then((r) => r.data),
  update: (id, data) => api.put(`/maintenances/${id}`, data).then((r) => r.data),
};
