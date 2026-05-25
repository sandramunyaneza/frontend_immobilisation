import api from './api';
export const amortissementsService = {
  list: () => api.get('/amortissements').then((r) => r.data),
  create: (data) => api.post('/amortissements', data).then((r) => r.data),
};
