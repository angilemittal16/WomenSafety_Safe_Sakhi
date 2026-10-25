const BASE_URL = '/api';

export function getToken() {
  return localStorage.getItem('safesakhi_token') || localStorage.getItem('safeher_token');
}

export function setToken(token) {
  if (token) {
    localStorage.setItem('safesakhi_token', token);
  } else {
    localStorage.removeItem('safesakhi_token');
    localStorage.removeItem('safeher_token');
  }
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem('safesakhi_user') || localStorage.getItem('safeher_user');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function setStoredUser(user) {
  if (user) {
    localStorage.setItem('safesakhi_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('safesakhi_user');
    localStorage.removeItem('safeher_user');
  }
}

export async function request(endpoint, options = {}) {
  const headers = { ...options.headers };
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Do not set Content-Type for FormData (browser sets boundary automatically)
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  if (res.status === 401) {
    // If unauthorized, clear token and notify
    if (!endpoint.includes('/auth/login') && !endpoint.includes('/auth/register')) {
      setToken(null);
      setStoredUser(null);
    }
  }

  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Server request failed');
    }
    return data;
  }

  if (!res.ok) {
    throw new Error(`Request failed with status ${res.status}`);
  }

  return res;
}

// API Service Functions
export const api = {
  // Auth
  register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  getMe: () => request('/auth/me'),
  updateMe: (body) => request('/auth/me', { method: 'PUT', body: JSON.stringify(body) }),
  deleteAllData: () => request('/auth/me', { method: 'DELETE' }),

  // Contacts
  getContacts: () => request('/contacts'),
  createContact: (body) => request('/contacts', { method: 'POST', body: JSON.stringify(body) }),
  updateContact: (id, body) => request(`/contacts/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteContact: (id) => request(`/contacts/${id}`, { method: 'DELETE' }),

  // SOS
  startSos: (body) => request('/sos', { method: 'POST', body: JSON.stringify(body) }),
  getActiveSos: () => request('/sos/active'),
  updateSosLocation: (id, body) => request(`/sos/${id}/location`, { method: 'POST', body: JSON.stringify(body) }),
  uploadSosMedia: (id, formData) => request(`/sos/${id}/media`, { method: 'POST', body: formData }),
  endSos: (id) => request(`/sos/${id}/end`, { method: 'POST' }),
  getSosTracking: (token) => request(`/sos/track/${token}`),

  // Journey
  startJourney: (body) => request('/journey/start', { method: 'POST', body: JSON.stringify(body) }),
  getActiveJourney: () => request('/journey/active'),
  updateJourneyLocation: (body) => request('/journey/update-location', { method: 'POST', body: JSON.stringify(body) }),
  journeyCheckIn: (safe) => request('/journey/check-in', { method: 'POST', body: JSON.stringify({ safe }) }),
  stopJourney: () => request('/journey/stop', { method: 'POST' }),
  getJourneyTracking: (token) => request(`/journey/track/${token}`),

  // Helplines
  getHelplines: () => request('/helplines'),
  createHelpline: (body) => request('/helplines', { method: 'POST', body: JSON.stringify(body) }),
  deleteHelpline: (id) => request(`/helplines/${id}`, { method: 'DELETE' }),

  // Cyber Incidents
  getIncidents: () => request('/incidents'),
  createIncident: (body) => request('/incidents', { method: 'POST', body: JSON.stringify(body) }),
  getIncident: (id) => request(`/incidents/${id}`),
  updateIncident: (id, body) => request(`/incidents/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteIncident: (id) => request(`/incidents/${id}`, { method: 'DELETE' }),
  getIncidentTimeline: (id) => request(`/incidents/${id}/timeline`),

  // Evidence
  createEvidence: (formData) => request('/evidence', { method: 'POST', body: formData }),
  updateEvidence: (id, body) => request(`/evidence/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteEvidence: (id) => request(`/evidence/${id}`, { method: 'DELETE' }),

  // Reports
  generateReport: (incidentId, edits) => request(`/reports/${incidentId}`, { method: 'POST', body: JSON.stringify({ edits }) }),
  getExportUrl: (reportId) => `/api/reports/${reportId}/export`,

  // Dev Outbox
  getDevOutbox: () => fetch('/dev/outbox').then(r => r.json()),
  clearDevOutbox: () => fetch('/dev/outbox/clear', { method: 'POST' }).then(r => r.json())
};
