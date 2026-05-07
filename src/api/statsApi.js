import api from './axiosInstance';

export const getProjectStats = (projectId) => api.get(`/api/projects/${projectId}/stats`);
export const getProjectRanking = (projectId) => api.get(`/api/projects/${projectId}/stats/ranking`);
