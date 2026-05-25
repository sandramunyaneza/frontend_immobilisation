import api from './api';
export const stockService = {
  list: () => api.get('/stock').then((r) => r.data),
};
