const API_BASE =
  (typeof window !== 'undefined' && window.__API_BASE__) ||
  process.env.REACT_APP_API_BASE ||
  'http://localhost:3091/api';

export { API_BASE };

const TOKEN_KEY = 'ddlm_token';
const USER_KEY  = 'ddlm_user';

export function getToken() {
  try { return localStorage.getItem(TOKEN_KEY); } catch (_) { return null; }
}
export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch (_) {}
}
export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) { return null; }
}
export function setStoredUser(user) {
  try {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_KEY);
  } catch (_) {}
}
export function logout() {
  setToken(null);
  setStoredUser(null);
  if (typeof window !== 'undefined') {
    window.location.assign('/login');
  }
}

// Role helpers — drone-delivery roles: admin > pilot > viewer
export function getRole() {
  return (getStoredUser()?.role || 'viewer').toLowerCase();
}
export function canWrite() {
  return ['admin', 'pilot'].includes(getRole());
}
export function isCommander() {
  return getRole() === 'admin';
}

async function request(url, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  let res;
  try {
    res = await fetch(`${API_BASE}${url}`, { ...options, headers });
  } catch (e) {
    throw new Error(`Network error: ${e.message}`);
  }

  if (res.status === 401) {
    if (!url.startsWith('/auth/login')) {
      logout();
      throw new Error('Session expired');
    }
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

function crud(base) {
  return {
    list:   ()       => request(`/${base}`),
    get:    (id)     => request(`/${base}/${id}`),
    create: (data)   => request(`/${base}`, { method: 'POST', body: JSON.stringify(data) }),
    update: (id, d)  => request(`/${base}/${id}`, { method: 'PUT',  body: JSON.stringify(d) }),
    remove: (id)     => request(`/${base}/${id}`, { method: 'DELETE' }),
    bulkImport: (csv) => request(`/${base}/bulk-import`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/csv' },
      body: csv,
    }),
    listAttachments: (id) => request(`/${base}/${id}/attachments`),
    uploadAttachment: async (id, file) => {
      const token = getToken();
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(`${API_BASE}/${base}/${id}/attachments`, {
        method: 'POST',
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: form,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Upload failed (${res.status})`);
      return data;
    },
  };
}

// Apply pass 7 — Part 135 ledger + vertiport scheduling slots
export const part135RecordsApi  = crud('part135-records');
export const vertiportSlotsApi  = crud('vertiport-slots');

// Vertiport-slot conflicts (deterministic, no AI)
export const getVertiportSlotConflicts = (vertiportId) => {
  const qs = vertiportId ? `?vertiport_id=${encodeURIComponent(vertiportId)}` : '';
  return request(`/vertiport-slots/conflicts${qs}`);
};

// External feed stubs (NEEDS-CREDS — return 503 until configured)
export const getFeedsStatus       = () => request('/feeds/status');
export const fetchNotamFeed       = () => request('/feeds/notam');
export const refreshNotamFeed     = () => request('/feeds/notam/refresh', { method: 'POST' });
export const fetchWeatherFeed     = () => request('/feeds/weather');
export const refreshWeatherFeed   = () => request('/feeds/weather/refresh', { method: 'POST' });
export const dispatchNotification = (body) => request('/feeds/notify/dispatch', { method: 'POST', body: JSON.stringify(body || {}) });

// Autonomy advisory (ADVISORY ONLY — never commands a drone)
export const autonomyBvlosFeasibility = (body) => request('/autonomy/bvlos-feasibility', { method: 'POST', body: JSON.stringify(body || {}) });
export const autonomyRtlArbiter       = (body) => request('/autonomy/rtl-arbiter',       { method: 'POST', body: JSON.stringify(body || {}) });
export const autonomySwarmDeconflict  = (body) => request('/autonomy/swarm-deconflict',  { method: 'POST', body: JSON.stringify(body || {}) });
export const autonomyGeofenceAdvise   = (body) => request('/autonomy/geofence-advise',   { method: 'POST', body: JSON.stringify(body || {}) });
export const autonomyEnergyBudget     = (body) => request('/autonomy/energy-budget',     { method: 'POST', body: JSON.stringify(body || {}) });
export const autonomyDensityBundle    = (body) => request('/autonomy/density-bundle',    { method: 'POST', body: JSON.stringify(body || {}) });

// 18 entity CRUD APIs
export const dronesApi              = crud('drones');
export const batteriesApi           = crud('batteries');
export const flightsApi             = crud('flights');
export const missionsApi            = crud('missions');
export const customersApi           = crud('customers');
export const packagesApi            = crud('packages');
export const depotsApi              = crud('depots');
export const vertiportsApi          = crud('vertiports');
export const pilotsApi              = crud('pilots');
export const observersApi           = crud('observers');
export const regulatoryApprovalsApi = crud('regulatory-approvals');
export const airspaceZonesApi       = crud('airspace-zones');
export const weatherBriefsApi       = crud('weather-briefs');
export const maintenanceLogsApi     = crud('maintenance-logs');
export const incidentsApi           = crud('incidents');
export const routeCorridorsApi      = crud('route-corridors');
export const payloadSpecsApi        = crud('payload-specs');
export const auditLogApi            = crud('audit-log');

// Dashboard
export const getDashboardStats = () => request('/dashboard');

// Auth
export const login = (email, password) =>
  request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
export const getMe = () => request('/auth/me');

// AI — 16 verbs
export const aiRouteCorridorPlan      = (body) => request('/ai/route-corridor-plan',      { method: 'POST', body: JSON.stringify(body || {}) });
export const aiWeatherFlightWindow    = (body) => request('/ai/weather-flight-window',    { method: 'POST', body: JSON.stringify(body || {}) });
export const aiMissionBrief           = (body) => request('/ai/mission-brief',            { method: 'POST', body: JSON.stringify(body || {}) });
export const aiAnomalyTriage          = (body) => request('/ai/anomaly-triage',           { method: 'POST', body: JSON.stringify(body || {}) });
export const aiExecutiveBrief         = (body) => request('/ai/executive-brief',          { method: 'POST', body: JSON.stringify(body || {}) });
export const aiPayloadWeightOptimize  = (body) => request('/ai/payload-weight-optimize',  { method: 'POST', body: JSON.stringify(body || {}) });
export const aiBatteryCyclePrognostic = (body) => request('/ai/battery-cycle-prognostic', { method: 'POST', body: JSON.stringify(body || {}) });
export const aiRegulatoryChecklist    = (body) => request('/ai/regulatory-checklist',     { method: 'POST', body: JSON.stringify(body || {}) });
export const aiPilotShiftSchedule     = (body) => request('/ai/pilot-shift-schedule',     { method: 'POST', body: JSON.stringify(body || {}) });
export const aiGroundObserverPlan     = (body) => request('/ai/ground-observer-plan',     { method: 'POST', body: JSON.stringify(body || {}) });
export const aiConflictAirspaceDetect = (body) => request('/ai/conflict-airspace-detect', { method: 'POST', body: JSON.stringify(body || {}) });
export const aiCustomerCommsDraft     = (body) => request('/ai/customer-comms-draft',     { method: 'POST', body: JSON.stringify(body || {}) });
export const aiVertiportCapacityPlan  = (body) => request('/ai/vertiport-capacity-plan',  { method: 'POST', body: JSON.stringify(body || {}) });
export const aiContingencyLandingPlan = (body) => request('/ai/contingency-landing-plan', { method: 'POST', body: JSON.stringify(body || {}) });
export const aiIncidentPostMortem     = (body) => request('/ai/incident-post-mortem',     { method: 'POST', body: JSON.stringify(body || {}) });
export const aiVendorQualityScore     = (body) => request('/ai/vendor-quality-score',     { method: 'POST', body: JSON.stringify(body || {}) });

// Apply pass 7 — 4 missing AI counterparts
export const aiCustomerEtaNarrate     = (body) => request('/ai/customer-eta-narrate',     { method: 'POST', body: JSON.stringify(body || {}) });
export const aiWeightBalanceAdvise    = (body) => request('/ai/weight-balance-advise',    { method: 'POST', body: JSON.stringify(body || {}) });
export const aiDeliveryWindowPredict  = (body) => request('/ai/delivery-window-predict',  { method: 'POST', body: JSON.stringify(body || {}) });
export const aiNotamAwareReroute      = (body) => request('/ai/notam-aware-reroute',      { method: 'POST', body: JSON.stringify(body || {}) });

// AI history
export const getAIHistory = (feature, limit = 25) => {
  const qs = new URLSearchParams({
    ...(feature ? { feature } : {}),
    limit: String(limit),
  }).toString();
  return request(`/ai/history?${qs}`);
};

// AI sample fills
export const getAISamples = (feature) => {
  const qs = new URLSearchParams({ feature: feature || '' }).toString();
  return request(`/ai/samples?${qs}`);
};

// Notifications
export const getNotifications       = () => request('/notifications');
export const getUnreadNotifications = () => request('/notifications/unread');
export const markNotificationRead   = (id) => request(`/notifications/${id}/read`, { method: 'POST' });
export const markAllNotificationsRead = () => request('/notifications/mark-all-read', { method: 'POST' });

// Webhooks
export const webhooksApi = {
  list:    ()         => request('/webhooks'),
  create:  (d)        => request('/webhooks',          { method: 'POST', body: JSON.stringify(d) }),
  update:  (id, d)    => request(`/webhooks/${id}`,    { method: 'PUT',  body: JSON.stringify(d) }),
  remove:  (id)       => request(`/webhooks/${id}`,    { method: 'DELETE' }),
  test:    (event, payload) => request('/webhooks/test', {
    method: 'POST',
    body: JSON.stringify({ event, payload }),
  }),
  deliveries: (id)    => request(`/webhooks/${id}/deliveries`),
};
