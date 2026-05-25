import api from './api';
export const categoriesImmobilisationsService = {
  list: () => api.get('/categories-immobilisations').then((r) => r.data),
  create: (data) => api.post('/categories-immobilisations', data).then((r) => r.data),
};
