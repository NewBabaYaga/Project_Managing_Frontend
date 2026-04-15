import api from './axiosInstance';

export const getMyStats = () => api.get('/api/users/me/stats');
export const getMemberStats = (projectId, userId) =>
  api.get(`/api/projects/${projectId}/members/${userId}/stats`);

export const getPublicProfile = (userId) => api.get(`/api/users/${userId}/profile`);

export const uploadAvatar = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/api/users/me/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const updateProfile = (data) => api.patch('/api/users/me/profile', data);
export const deleteAccount = () => api.delete('/api/users/me');
export const searchUsers = (q) => api.get('/api/users/search', { params: { q } });
