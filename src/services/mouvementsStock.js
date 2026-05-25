import api from './api';
export const mouvementsStockService = {
  list: () => api.get('/mouvements-stock').then((r) => r.data),
  create: (data) => api.post('/mouvements-stock', data).then((r) => r.data),
};
