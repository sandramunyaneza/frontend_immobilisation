import api from './api';
export const decisionsService = {
  list: () => api.get('/decisions').then((r) => r.data),
  create: (data) => api.post('/decisions', data).then((r) => r.data),
  update: (id, data) => api.put(`/decisions/${id}`, data).then((r) => r.data),
};
