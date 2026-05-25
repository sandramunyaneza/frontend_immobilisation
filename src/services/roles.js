import api from './api';
export const rolesService = {
  list: () => api.get('/roles').then((r) => r.data),
  create: (data) => api.post('/roles', data).then((r) => r.data),
  update: (id, data) => api.put(`/roles/${id}`, data).then((r) => r.data),
};
