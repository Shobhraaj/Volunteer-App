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
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

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
  login:    (data) => request('/auth/login',    { method: 'POST', body: JSON.stringify(data) }),
  getMe:    ()     => request('/auth/me'),

  // Volunteers
  getProfile:          ()        => request('/volunteers/me'),
  updateProfile:       (data)    => request('/volunteers/me', { method: 'PUT', body: JSON.stringify(data) }),
  getBadges:           ()        => request('/volunteers/me/badges'),
  getRecommendations:  (limit=10)=> request(`/volunteers/recommendations?limit=${limit}`),
  applyToTask:         (taskId)  => request('/volunteers/apply', { method: 'POST', body: JSON.stringify({ task_id: taskId }) }),
  getHistory:          ()        => request('/volunteers/history'),
  completeTask:        (pid)     => request(`/volunteers/complete/${pid}`, { method: 'POST' }),
  cancelParticipation: (pid)     => request(`/volunteers/cancel/${pid}`,   { method: 'DELETE' }),
  getCertificates:     ()        => request('/volunteers/certificates'),

  // Tasks
  listTasks:        (status='') => request(`/tasks/${status ? `?status=${status}` : ''}`),
  getTask:          (id)        => request(`/tasks/${id}`),
  createTask:       (data)      => request('/tasks/', { method: 'POST', body: JSON.stringify(data) }),
  updateTask:       (id, data)  => request(`/tasks/${id}`, { method: 'PUT',    body: JSON.stringify(data) }),
  deleteTask:       (id)        => request(`/tasks/${id}`, { method: 'DELETE' }),
  getMatches:       (tid, n=10) => request(`/tasks/${tid}/matches?top_n=${n}`),
  assignVolunteers: (tid, ids)  => request(`/tasks/${tid}/assign`,      { method: 'POST', body: JSON.stringify({ volunteer_ids: ids }) }),
  autoAssign:       (tid)       => request(`/tasks/${tid}/auto-assign`, { method: 'POST' }),
  getParticipants:  (tid)       => request(`/tasks/${tid}/participants`),
  updateParticipationStatus: (tid, vid, status) => request(`/tasks/${tid}/participation/${vid}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  withdrawFromTask: (tid) => request(`/tasks/${tid}/withdraw`, { method: 'POST' }),
  cancelAssignment: (tid, vid) => request(`/tasks/${tid}/cancel-assignment/${vid}`, { method: 'POST' }),

  // Organizer
  getMyTasks:    ()      => request('/organizers/my-tasks'),
  getOrgStats:   ()      => request('/organizers/stats'),
  getReliability:(volId) => request(`/organizers/volunteer/${volId}/reliability`),
  trainModel:    ()      => request('/organizers/train-model', { method: 'POST' }),

  // Analytics
  getDashboard:   () => request('/analytics/dashboard'),
  getLeaderboard: (limit=20) => request(`/analytics/leaderboard?limit=${limit}`),
  exportReport:   () => `${BASE}/analytics/export`, // Return URL for direct download


  // Chatbot
  sendChatMessage: (message) => request('/chatbot', { method: 'POST', body: JSON.stringify({ message }) }),
};

export default api;
