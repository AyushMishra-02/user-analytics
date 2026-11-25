// API Client for CausalFunnel Multi-Tenant Analytics Dashboard

const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api`
  : '/api';

export const BACKEND_ORIGIN = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/$/, '')
  : 'http://localhost:5000';

const getHeaders = (extra = {}) => {
  const token = localStorage.getItem('cf_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
};

async function handleResponse(res, fallbackMsg) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || data.message || fallbackMsg);
  }
  return data;
}

// --- Auth ---
export async function loginUser(email, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return handleResponse(res, 'Login failed');
}

export async function registerUser(name, email, password) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
  return handleResponse(res, 'Registration failed');
}

export async function fetchMe() {
  const res = await fetch(`${API_BASE}/auth/me`, { headers: getHeaders() });
  return handleResponse(res, 'Failed to verify session');
}

// --- Sites ---
export async function fetchSites() {
  const res = await fetch(`${API_BASE}/sites`, { headers: getHeaders() });
  return handleResponse(res, 'Failed to fetch sites');
}

export async function createSiteApi(name, domain) {
  const res = await fetch(`${API_BASE}/sites`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ name, domain }),
  });
  return handleResponse(res, 'Failed to create site');
}

export async function deleteSiteApi(siteId) {
  const res = await fetch(`${API_BASE}/sites/${encodeURIComponent(siteId)}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  return handleResponse(res, 'Failed to delete site');
}

export async function regenerateSiteKeyApi(siteId) {
  const res = await fetch(`${API_BASE}/sites/${encodeURIComponent(siteId)}/regenerate-key`, {
    method: 'POST',
    headers: getHeaders(),
  });
  return handleResponse(res, 'Failed to regenerate API key');
}

// --- Analytics (scoped by siteId) ---
export async function fetchOverviewStats(siteId, { startDate, endDate } = {}) {
  const params = new URLSearchParams({ siteId });
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  const res = await fetch(`${API_BASE}/analytics/overview?${params.toString()}`, {
    headers: getHeaders(),
  });
  return handleResponse(res, 'Failed to fetch analytics overview');
}

export async function fetchSessions(siteId, { page = 1, limit = 50, sortBy = 'lastActive', order = 'desc', search = '', startDate, endDate } = {}) {
  const params = new URLSearchParams({
    siteId,
    page: String(page),
    limit: String(limit),
    sortBy,
    order,
  });
  if (search) params.append('search', search);
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);

  const res = await fetch(`${API_BASE}/sessions?${params.toString()}`, {
    headers: getHeaders(),
  });
  return handleResponse(res, 'Failed to fetch sessions');
}

export async function fetchSessionDetails(siteId, sessionId) {
  const res = await fetch(
    `${API_BASE}/sessions/${encodeURIComponent(sessionId)}?siteId=${encodeURIComponent(siteId)}`,
    { headers: getHeaders() }
  );
  return handleResponse(res, `Failed to fetch session ${sessionId}`);
}

export async function fetchTrackedPages(siteId, { startDate, endDate } = {}) {
  const params = new URLSearchParams({ siteId });
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  const res = await fetch(`${API_BASE}/analytics/pages?${params.toString()}`, {
    headers: getHeaders(),
  });
  return handleResponse(res, 'Failed to fetch tracked pages');
}

export async function fetchHeatmapData(siteId, url, { startDate, endDate } = {}) {
  const params = new URLSearchParams({ siteId, url });
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  const res = await fetch(`${API_BASE}/analytics/heatmap?${params.toString()}`, {
    headers: getHeaders(),
  });
  return handleResponse(res, 'Failed to fetch heatmap data');
}

export async function fetchRecentEvents(siteId, limit = 40) {
  const res = await fetch(
    `${API_BASE}/events?siteId=${encodeURIComponent(siteId)}&limit=${limit}`,
    { headers: getHeaders() }
  );
  return handleResponse(res, 'Failed to fetch recent events');
}

export async function seedDemoData(siteId) {
  const res = await fetch(`${API_BASE}/analytics/seed?siteId=${encodeURIComponent(siteId)}`, {
    method: 'POST',
    headers: getHeaders(),
  });
  return handleResponse(res, 'Failed to seed demo data');
}

export async function resetAllData(siteId) {
  const res = await fetch(`${API_BASE}/analytics/reset?siteId=${encodeURIComponent(siteId)}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  return handleResponse(res, 'Failed to reset analytics data');
}

export async function downloadCsvExport(siteId) {
  const res = await fetch(
    `${API_BASE}/analytics/export?siteId=${encodeURIComponent(siteId)}&format=csv`,
    { headers: getHeaders() }
  );
  if (!res.ok) throw new Error('Failed to export CSV');
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `causalfunnel-${siteId}-sessions.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}
