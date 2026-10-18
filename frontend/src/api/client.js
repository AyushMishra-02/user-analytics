// API Client for CausalFunnel Analytics Dashboard

const API_BASE = '/api';

export async function fetchOverviewStats() {
  const res = await fetch(`${API_BASE}/analytics/overview`);
  if (!res.ok) throw new Error('Failed to fetch analytics overview');
  return res.json();
}

export async function fetchSessions({ page = 1, limit = 50, sortBy = 'lastActive', order = 'desc', search = '' } = {}) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    sortBy,
    order,
  });
  if (search) params.append('search', search);

  const res = await fetch(`${API_BASE}/sessions?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch sessions');
  return res.json();
}

export async function fetchSessionDetails(sessionId) {
  const res = await fetch(`${API_BASE}/sessions/${encodeURIComponent(sessionId)}`);
  if (!res.ok) throw new Error(`Failed to fetch session ${sessionId}`);
  return res.json();
}

export async function fetchTrackedPages() {
  const res = await fetch(`${API_BASE}/analytics/pages`);
  if (!res.ok) throw new Error('Failed to fetch tracked pages');
  return res.json();
}

export async function fetchHeatmapData(url) {
  const res = await fetch(`${API_BASE}/analytics/heatmap?url=${encodeURIComponent(url)}`);
  if (!res.ok) throw new Error('Failed to fetch heatmap data');
  return res.json();
}

export async function fetchRecentEvents(limit = 40) {
  const res = await fetch(`${API_BASE}/events?limit=${limit}`);
  if (!res.ok) throw new Error('Failed to fetch recent events');
  return res.json();
}

export async function seedDemoData() {
  const res = await fetch(`${API_BASE}/analytics/seed`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to seed demo data');
  return res.json();
}

export async function resetAllData() {
  const res = await fetch(`${API_BASE}/analytics/reset`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to reset analytics data');
  return res.json();
}
