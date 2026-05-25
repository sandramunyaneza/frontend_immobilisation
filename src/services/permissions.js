import api from './api';
export const permissionsService = {
  list: () => api.get('/permissions').then((r) => r.data),
  create: (data) => api.post('/permissions', data).then((r) => r.data),
};
