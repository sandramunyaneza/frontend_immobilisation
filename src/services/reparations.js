import api from './api';
export const reparationsService = {
  list: () => api.get('/reparations').then((r) => r.data),
  create: (data) => api.post('/reparations', data).then((r) => r.data),
};
