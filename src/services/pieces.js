import api from './api';
export const piecesService = {
  list: () => api.get('/pieces').then((r) => r.data),
  create: (data) => api.post('/pieces', data).then((r) => r.data),
  update: (id, data) => api.put(`/pieces/${id}`, data).then((r) => r.data),
};
