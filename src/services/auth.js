import api from './api';

export const authService = {
  login: (email, mot_de_passe) =>
    api.post('/auth/login', { email, mot_de_passe }).then((r) => r.data),
  me: () => api.get('/auth/me').then((r) => r.data),
};
