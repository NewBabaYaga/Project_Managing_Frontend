import api from './axiosInstance';

export const getMyStats = () => api.get('/api/users/me/stats');
export const getMemberStats = (projectId, userId) =>
  api.get(`/api/projects/${projectId}/members/${userId}/stats`);
