import api from './api';
export const rapportsService = {
  list: () => api.get('/rapports').then((r) => r.data),
  create: (data) => api.post('/rapports', data).then((r) => r.data),
};
