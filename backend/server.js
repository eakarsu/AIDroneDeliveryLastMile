const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { authenticateToken } = require('./middleware/auth');
const pool = require('./config/database');
const { fireWebhook } = require('./services/webhooks');

async function onIncidentCreated(row) {
  const sev = String(row.severity || '').toLowerCase();
  if (['critical', 'high'].includes(sev)) {
    try {
      await pool.query(
        `INSERT INTO notifications (user_id, title, body, severity, source)
         VALUES (NULL, $1, $2, $3, $4)`,
        [`Incident: ${row.type}`,
         `Flight ${row.flight_id || '—'} — severity ${sev}`.slice(0, 1000),
         sev,
         'incidents']
      );
    } catch (e) { console.warn('[notify] incident insert failed:', e.message); }
    fireWebhook(`incident.${sev}`, { row }).catch(() => {});
  }
}

const app = express();
const PORT = process.env.BACKEND_PORT || 3091;
const HOST = process.env.HOST || '127.0.0.1';

// Middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3090,http://localhost:3091,http://localhost:3000')
  .split(',').map((o) => o.trim()).filter(Boolean);
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Health check (public)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth (public)
app.use('/api/auth', require('./routes/auth'));

// Everything below this line requires a Bearer token.
app.use('/api', authenticateToken);

// Supported primary workflow. It records authorization and external outcomes,
// but never sends commands to an aircraft or airspace provider.
app.use('/api/governed-missions', require('./routes/governedMissions'));

// The broad legacy CRUD/demo surface predates tenant scoping. Keep it
// quarantined until an owner explicitly opts in and migrates every route.
if (process.env.ENABLE_LEGACY_ROUTES !== 'true') {
  app.use('/api', (req, res) => res.status(404).json({ error: 'Legacy routes are disabled; use /api/governed-missions' }));
}

// 18 CRUD entity routes (built via _crudFactory which already embeds RBAC + bulk-import + attachments)
app.use('/api/drones',                require('./routes/drones'));
app.use('/api/batteries',             require('./routes/batteries'));
app.use('/api/flights',               require('./routes/flights'));
app.use('/api/missions',              require('./routes/missions'));
app.use('/api/customers',             require('./routes/customers'));
app.use('/api/packages',              require('./routes/packages'));
app.use('/api/depots',                require('./routes/depots'));
app.use('/api/vertiports',            require('./routes/vertiports'));
app.use('/api/pilots',                require('./routes/pilots'));
app.use('/api/observers',             require('./routes/observers'));
app.use('/api/regulatory-approvals',  require('./routes/regulatoryApprovals'));
app.use('/api/airspace-zones',        require('./routes/airspaceZones'));
app.use('/api/weather-briefs',        require('./routes/weatherBriefs'));
app.use('/api/maintenance-logs',      require('./routes/maintenanceLogs'));
app.use('/api/incidents',             require('./routes/incidents'));
app.use('/api/route-corridors',       require('./routes/routeCorridors'));
app.use('/api/payload-specs',         require('./routes/payloadSpecs'));
app.use('/api/audit-log',             require('./routes/auditLog'));

// AI routes (16 sub-endpoints + history under /api/ai)
app.use('/api/ai', require('./routes/ai'));

// Cross-cutting
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/attachments',   require('./routes/attachments'));
app.use('/api/webhooks',      require('./routes/webhooks'));

// Dashboard stats
app.use('/api/dashboard', require('./routes/dashboard'));

// Custom views (Flight Views page: map, battery grid, mission funnel, vertiport capacity)
app.use('/api/custom-views', require('./routes/customViews'));

// ─── Apply pass 7 (full backlog implementation) ─────────────────────────────
// Part 135 consolidated records ledger (CRUD)
app.use('/api/part135-records',  require('./routes/part135Records'));
// Vertiport scheduling slots + deterministic conflict detector
app.use('/api/vertiport-slots',  require('./routes/vertiportSlots'));
// External feed stubs (NEEDS-CREDS: NOTAM, weather, notification dispatch)
app.use('/api/feeds',            require('./routes/feeds'));
// Autonomy ADVISORY-ONLY endpoints (TOO-RISKY items per audit note)
app.use('/api/autonomy',         require('./routes/autonomyAdvisory'));

app.use((err, req, res, next) => {
  console.error('Request failed:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, HOST, () => {
  console.log(`\nAI Drone Delivery Last-Mile API running on http://${HOST}:${PORT}`);
  console.log(`Legacy routes: ${process.env.ENABLE_LEGACY_ROUTES === 'true' ? 'enabled' : 'disabled'}\n`);
});
