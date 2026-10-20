// API Client with automatic token handling
const API_BASE = '/api';

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('cc_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }

  return data;
}

export const api = {
  // Auth
  login: (email, password) => apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  }),
  register: (userData) => apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData)
  }),
  getMe: () => apiRequest('/auth/me'),
  switchDemoUser: (role) => apiRequest('/auth/switch-demo-user', {
    method: 'POST',
    body: JSON.stringify({ role })
  }),

  // Events
  getEvents: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v) query.append(k, v);
    });
    return apiRequest(`/events?${query.toString()}`);
  },
  getEvent: (id) => apiRequest(`/events/${id}`),
  createEvent: (data) => apiRequest('/events', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  registerForEvent: (id, formData = {}) => apiRequest(`/events/${id}/register`, {
    method: 'POST',
    body: JSON.stringify(formData)
  }),
  cancelRegistration: (id) => apiRequest(`/events/${id}/register`, {
    method: 'DELETE'
  }),
  getAttendees: (id) => apiRequest(`/events/${id}/attendees`),
  checkInAttendee: (id, payload) => apiRequest(`/events/${id}/check-in`, {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  getEventStats: (id) => apiRequest(`/events/${id}/stats`),
  issueCertificates: (id) => apiRequest(`/events/${id}/issue-certificates`, {
    method: 'POST'
  }),
  getCertificate: (id) => apiRequest(`/events/${id}/certificate`),

  // Clubs
  getClubs: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v) query.append(k, v);
    });
    return apiRequest(`/clubs?${query.toString()}`);
  },
  getClub: (id) => apiRequest(`/clubs/${id}`),
  joinClub: (id) => apiRequest(`/clubs/${id}/join`, {
    method: 'POST'
  }),
  getLeaderboard: () => apiRequest('/clubs/stats/leaderboard'),

  // Admin
  getAdminStats: () => apiRequest('/admin/stats'),
  getProposals: (status) => apiRequest(`/admin/proposals${status ? `?status=${status}` : ''}`),
  approveEvent: (id, notes) => apiRequest(`/admin/events/${id}/approve`, {
    method: 'POST',
    body: JSON.stringify({ notes })
  }),
  rejectEvent: (id, reason) => apiRequest(`/admin/events/${id}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason })
  }),
  getAccreditationReport: () => apiRequest('/admin/accreditation-report'),
  getClubsCompliance: () => apiRequest('/admin/clubs-compliance'),
  updateClubCompliance: (id, data) => apiRequest(`/admin/clubs/${id}/compliance`, {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  getAuditLogs: () => apiRequest('/admin/audit-logs'),

  // Announcements & Notifications
  getAnnouncements: (params = {}) => {
    const cleanParams = {};
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '' && v !== 'undefined') {
        cleanParams[k] = v;
      }
    });
    const query = new URLSearchParams(cleanParams).toString();
    return apiRequest(`/announcements${query ? `?${query}` : ''}`);
  },
  createAnnouncement: (data) => apiRequest('/announcements', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  acknowledgeAdvisory: () => apiRequest('/announcements/urgent/acknowledge', {
    method: 'POST'
  }),
  toggleFeed: (id) => apiRequest(`/announcements/feeds/${id}/toggle`, {
    method: 'POST'
  }),
  getNotifications: () => apiRequest('/notifications'),
  markNotificationRead: (id) => apiRequest(`/notifications/${id}/read`, {
    method: 'PATCH'
  }),
  markAllNotificationsRead: () => apiRequest('/notifications/mark-all-read', {
    method: 'POST'
  })
};

export default api;
