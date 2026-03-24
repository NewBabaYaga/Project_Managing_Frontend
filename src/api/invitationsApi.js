import api from './axiosInstance';

export const getMyInvitations = () => api.get('/api/invitations/me');
export const getInvitationByToken = (token) => api.get(`/api/invitations/${token}`);
export const acceptInvitation = (token) => api.post(`/api/invitations/${token}/accept`);
export const declineInvitation = (token) => api.post(`/api/invitations/${token}/decline`);
