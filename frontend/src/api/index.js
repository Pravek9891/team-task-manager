import api from './axios';

export const authApi = {
  login: (credentials) => api.post('/auth/login/', credentials),
  register: (data) => api.post('/auth/register/', data),
  logout: (refresh) => api.post('/auth/logout/', { refresh }),
  me: () => api.get('/auth/me/'),
  updateProfile: (data) => api.patch('/auth/me/', data),
  changePassword: (data) => api.put('/auth/change-password/', data),
  listUsers: () => api.get('/auth/users/'),
};

export const projectsApi = {
  list: () => api.get('/projects/'),
  get: (id) => api.get(`/projects/${id}/`),
  create: (data) => api.post('/projects/', data),
  update: (id, data) => api.patch(`/projects/${id}/`, data),
  delete: (id) => api.delete(`/projects/${id}/`),
  addMember: (id, userId) => api.post(`/projects/${id}/add_member/`, { user_id: userId }),
  removeMember: (id, userId) => api.delete(`/projects/${id}/remove_member/${userId}/`),
  members: (id) => api.get(`/projects/${id}/members/`),
};

export const tasksApi = {
  list: (params) => api.get('/tasks/', { params }),
  get: (id) => api.get(`/tasks/${id}/`),
  create: (data) => api.post('/tasks/', data),
  update: (id, data) => api.patch(`/tasks/${id}/`, data),
  delete: (id) => api.delete(`/tasks/${id}/`),
  updateStatus: (id, status) => api.patch(`/tasks/${id}/status/`, { status }),
  myTasks: () => api.get('/tasks/my-tasks/'),
};

export const dashboardApi = {
  get: () => api.get('/dashboard/'),
};
