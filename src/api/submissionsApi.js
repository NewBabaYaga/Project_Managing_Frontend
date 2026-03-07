import api from './axiosInstance';

export const getSubmissions = (taskId) => api.get(`/api/tasks/${taskId}/submissions`);

export const createSubmission = (taskId, formData) =>
  api.post(`/api/tasks/${taskId}/submissions`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const createReview = (submissionId, data) =>
  api.post(`/api/submissions/${submissionId}/reviews`, data);
