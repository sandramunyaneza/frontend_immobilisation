import api from './api';
export const auditService = {
  list: () => api.get('/audit').then((r) => r.data),
};
