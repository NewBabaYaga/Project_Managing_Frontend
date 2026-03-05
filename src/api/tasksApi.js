import api from './axiosInstance';

export const getTasks = (projectId) => api.get(`/api/projects/${projectId}/tasks`);
export const getTask = (projectId, taskId) => api.get(`/api/projects/${projectId}/tasks/${taskId}`);
export const createTask = (projectId, formData) =>
  api.post(`/api/projects/${projectId}/tasks`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
export const updateTaskStatus = (projectId, taskId, data) =>
  api.patch(`/api/projects/${projectId}/tasks/${taskId}/status`, data);

export const reassignTask = (projectId, taskId, assignedToId) =>
  api.patch(`/api/projects/${projectId}/tasks/${taskId}/assign`, { assignedToId: assignedToId ?? null });

export const getTaskComments = (projectId, taskId) =>
  api.get(`/api/tasks/${projectId}/${taskId}/comments`);
export const addTaskComment = (projectId, taskId, data) =>
  api.post(`/api/tasks/${projectId}/${taskId}/comments`, data);
