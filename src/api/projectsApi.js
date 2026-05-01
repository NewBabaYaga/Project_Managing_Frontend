import api from './axiosInstance';

export const getProjects = () => api.get('/api/projects');
export const getProject = (id) => api.get(`/api/projects/${id}`);
export const createProject = (data) => api.post('/api/projects', data);
export const updateProject = (id, data) => api.patch(`/api/projects/${id}`, data);
export const deleteProject = (id) => api.delete(`/api/projects/${id}`);
export const uploadProjectImage = (projectId, file) => {
  const form = new FormData();
  form.append('file', file);
  return api.post(`/api/projects/${projectId}/image`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
};

export const getMembers = (projectId) => api.get(`/api/projects/${projectId}/members`);
export const sendInvitation = (projectId, data) => api.post(`/api/projects/${projectId}/invitations`, data);
export const getProjectInvitations = (projectId) => api.get(`/api/projects/${projectId}/invitations`);
export const cancelInvitation = (projectId, invitationId) => api.delete(`/api/projects/${projectId}/invitations/${invitationId}`);
export const generateInviteLink = (projectId, options = null) => api.post(`/api/projects/${projectId}/invite-link`, options);
export const getInviteLinks = (projectId) => api.get(`/api/projects/${projectId}/invite-links`);
export const deleteInviteLink = (projectId, invitationId) => api.delete(`/api/projects/${projectId}/invite-links/${invitationId}`);

export const removeMember = (projectId, userId) => api.delete(`/api/projects/${projectId}/members/${userId}`);
export const updateMemberRole = (projectId, userId, newRole) =>
  api.patch(`/api/projects/${projectId}/members/${userId}/role`, { newRole });
export const assignManagerGroup = (projectId, developerUserId, managerUserId) =>
  api.patch(`/api/projects/${projectId}/members/${developerUserId}/manager`, { managerUserId });
export const delegateTask = (projectId, taskId, developerUserId) =>
  api.post(`/api/projects/${projectId}/tasks/${taskId}/delegate`, { developerUserId });

export const getProjectHistory = (projectId) => api.get(`/api/projects/${projectId}/history`);
