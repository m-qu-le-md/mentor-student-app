import api from '../api/axiosClient';

const data = (request) => request.then((response) => response.data);

export const taskApi = {
  list: () => data(api.get('/tasks')),
  recommended: () => data(api.get('/tasks/recommended')),
  get: (id) => data(api.get(`/tasks/${id}`)),
  create: (payload) => data(api.post('/tasks', payload)),
  update: (id, payload) => data(api.put(`/tasks/${id}`, payload)),
  remove: (id) => data(api.delete(`/tasks/${id}`)),
  complete: (id) => data(api.put(`/tasks/${id}/complete`)),
};

export const planningApi = {
  board: () => data(api.get('/planning')),
  createColumn: (title) => data(api.post('/planning/columns', { title })),
  updateColumn: (id, title) => data(api.put(`/planning/columns/${id}`, { title })),
  deleteColumn: (id, targetColumnId) => data(api.delete(`/planning/columns/${id}`, { data: { targetColumnId } })),
  reorderColumns: (orderedIds) => data(api.put('/planning/columns/reorder', { orderedIds })),
  createCard: (columnId, title) => data(api.post('/planning/cards', { columnId, title })),
  updateCard: (id, title) => data(api.put(`/planning/cards/${id}`, { title })),
  moveCard: (columnId, orderedIds) => data(api.put('/planning/cards/reorder', { columnId, orderedIds })),
  removeCard: (id) => data(api.delete(`/planning/cards/${id}`)),
  assignCard: (id, payload) => data(api.post(`/planning/cards/${id}/assign`, payload)),
};

export const evaluationApi = {
  list: () => data(api.get('/evaluations')),
  create: (payload) => data(api.post('/evaluations', payload)),
};

export const gamificationApi = {
  dashboard: () => data(api.get('/gamification/dashboard')),
  algorithm: () => data(api.get('/gamification/algorithm')),
  activity: () => data(api.get('/gamification/activity')),
  updateWeek: (payload) => data(api.put('/gamification/weeks/current', payload)),
};

export const notificationApi = {
  settings: () => data(api.get('/notifications/settings')),
  updateSettings: (payload) => data(api.put('/notifications/settings', payload)),
  subscribe: (subscription) => data(api.post('/notifications/subscriptions', subscription)),
  unsubscribe: (endpoint) => data(api.delete('/notifications/subscriptions', { data: { endpoint } })),
  publicKey: () => data(api.get('/notifications/vapid-public-key')),
};
