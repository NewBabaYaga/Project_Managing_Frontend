import api from './axiosInstance';

export const getProjects = () => api.get('/api/projects');
export const getProject = (id) => api.get(`/api/projects/${id}`);
export const createProject = (data) => api.post('/api/projects', data);
export const getMembers = (projectId) => api.get(`/api/projects/${projectId}/members`);
export const sendInvitation = (projectId, data) => api.post(`/api/projects/${projectId}/invitations`, data);
export const getProjectInvitations = (projectId) => api.get(`/api/projects/${projectId}/invitations`);
export const cancelInvitation = (projectId, invitationId) => api.delete(`/api/projects/${projectId}/invitations/${invitationId}`);
export const generateInviteLink = (projectId) => api.post(`/api/projects/${projectId}/invite-link`);
export const removeMember = (projectId, userId) => api.delete(`/api/projects/${projectId}/members/${userId}`);
export const updateMemberRole = (projectId, userId, newRole) =>
  api.patch(`/api/projects/${projectId}/members/${userId}/role`, { newRole });
export const assignManagerGroup = (projectId, developerUserId, managerUserId) =>
  api.patch(`/api/projects/${projectId}/members/${developerUserId}/manager`, { managerUserId });
export const delegateTask = (projectId, taskId, developerUserId) =>
  api.post(`/api/projects/${projectId}/tasks/${taskId}/delegate`, { developerUserId });
