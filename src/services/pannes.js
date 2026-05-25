import api from './api';
export const pannesService = {
  list: () => api.get('/pannes').then((r) => r.data),
  create: (data) => api.post('/pannes', data).then((r) => r.data),
  update: (id, data) => api.put(`/pannes/${id}`, data).then((r) => r.data),
};
