/**
 * API helper — wraps fetch with JWT auth headers and base URL handling.
 */

const BASE = '/api';

function getToken() {
  return localStorage.getItem('token');
}

async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || `Request failed (${res.status})`);
  }

  return res.json();
}

const api = {
  // Auth
  register: (data) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data) => request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => request('/auth/me'),

  // Volunteers
  getProfile: () => request('/volunteers/me'),
  updateProfile: (data) => request('/volunteers/me', { method: 'PUT', body: JSON.stringify(data) }),
  getBadges: () => request('/volunteers/me/badges'),
  getRecommendations: (limit = 10) => request(`/volunteers/recommendations?limit=${limit}`),
  applyToTask: (taskId) => request('/volunteers/apply', { method: 'POST', body: JSON.stringify({ task_id: taskId }) }),
  getHistory: () => request('/volunteers/history'),
  completeTask: (participationId) => request(`/volunteers/complete/${participationId}`, { method: 'POST' }),

  // Tasks
  listTasks: (status = '') => request(`/tasks/${status ? `?status=${status}` : ''}`),
  getTask: (id) => request(`/tasks/${id}`),
  createTask: (data) => request('/tasks/', { method: 'POST', body: JSON.stringify(data) }),
  updateTask: (id, data) => request(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTask: (id) => request(`/tasks/${id}`, { method: 'DELETE' }),
  getMatches: (taskId, topN = 10) => request(`/tasks/${taskId}/matches?top_n=${topN}`),
  assignVolunteers: (taskId, volunteerIds) => request(`/tasks/${taskId}/assign`, { method: 'POST', body: JSON.stringify({ volunteer_ids: volunteerIds }) }),
  autoAssign: (taskId) => request(`/tasks/${taskId}/auto-assign`, { method: 'POST' }),
  getParticipants: (taskId) => request(`/tasks/${taskId}/participants`),

  // Organizer
  getMyTasks: () => request('/organizers/my-tasks'),
  getOrgStats: () => request('/organizers/stats'),
  getReliability: (volId) => request(`/organizers/volunteer/${volId}/reliability`),
  trainModel: () => request('/organizers/train-model', { method: 'POST' }),

  // Analytics
  getDashboard: () => request('/analytics/dashboard'),
};

export default api;
