import api from './axiosInstance';

export const getNotifications = () => api.get('/api/notifications');
export const markRead = (id) => api.patch(`/api/notifications/${id}/read`);
export const markAllRead = () => api.patch('/api/notifications/read-all');
export const deleteNotification = (id) => api.delete(`/api/notifications/${id}`);
export const clearAllNotifications = () => api.delete('/api/notifications/clear');
export const getNotificationPreferences = () => api.get('/api/notifications/preferences');
export const updateNotificationPreferences = (prefs) => api.put('/api/notifications/preferences', prefs);
