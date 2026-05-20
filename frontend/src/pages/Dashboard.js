import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboardStats } from '../services/api';

const FEATURES = [
  { path: '/drones',                title: 'Drone Fleet',         icon: 'D', color: '#3b82f6', desc: 'Airframes available for BVLOS last-mile.' },
  { path: '/batteries',             title: 'Batteries',           icon: 'B', color: '#06b6d4', desc: 'LiPo / Li-ion cycle counts and SoH.' },
  { path: '/flights',               title: 'Flights',             icon: 'F', color: '#10b981', desc: 'Scheduled and in-flight sorties.' },
  { path: '/missions',              title: 'Missions',            icon: 'M', color: '#f59e0b', desc: 'Pickup-to-dropoff delivery missions.' },
  { path: '/customers',             title: 'Customers',           icon: 'C', color: '#a78bfa', desc: 'Healthcare / retail / pharmacy partners.' },
  { path: '/packages',              title: 'Packages',            icon: 'P', color: '#ec4899', desc: 'Individual payloads in transit.' },
  { path: '/depots',                title: 'Depots',              icon: '#', color: '#22c55e', desc: 'Distribution hubs and regional bases.' },
  { path: '/vertiports',            title: 'Vertiports',          icon: 'V', color: '#ef4444', desc: 'VTOL pad facilities and capacity.' },
  { path: '/pilots',                title: 'Pilots',              icon: 'L', color: '#0ea5e9', desc: 'Remote pilots, licenses, certifications.' },
  { path: '/observers',             title: 'Visual Observers',    icon: 'O', color: '#14b8a6', desc: 'Ground observers along corridors.' },
  { path: '/regulatory-approvals',  title: 'Regulatory Approvals',icon: 'R', color: '#fb7185', desc: 'Part 135 / BVLOS waivers / Specific Cat.' },
  { path: '/airspace-zones',        title: 'Airspace Zones',      icon: 'A', color: '#facc15', desc: 'Class B/C/D, CTRs, TMAs, TFRs.' },
  { path: '/weather-briefs',        title: 'Weather Briefs',      icon: 'W', color: '#a3e635', desc: 'Wind / ceiling / visibility outlook.' },
  { path: '/maintenance-logs',      title: 'Maintenance Logs',    icon: 'X', color: '#60a5fa', desc: 'Drone work records.' },
  { path: '/incidents',             title: 'Incidents',           icon: 'I', color: '#dc2626', desc: 'C2 dropout, GPS loss, parachute events.' },
  { path: '/route-corridors',       title: 'Route Corridors',     icon: 'K', color: '#7dd3fc', desc: 'Approved BVLOS corridors.' },
  { path: '/payload-specs',         title: 'Payload Specs',       icon: 'S', color: '#f472b6', desc: 'Max weight / dims / hazmat per type.' },
  { path: '/audit-log',             title: 'Audit Log',           icon: 'G', color: '#34d399', desc: 'Actor / target / action governance.' },

  { path: '/ai/route-corridor-plan',      title: 'AI · Route Corridor Plan',      icon: '*', color: '#8b5cf6', desc: 'Generate BVLOS corridor + alternates.' },
  { path: '/ai/weather-flight-window',    title: 'AI · Weather Flight Window',    icon: '*', color: '#8b5cf6', desc: 'Identify safest 24h flight windows.' },
  { path: '/ai/mission-brief',            title: 'AI · Mission Brief',            icon: '*', color: '#8b5cf6', desc: 'Pre-flight brief end-to-end.' },
  { path: '/ai/anomaly-triage',           title: 'AI · Anomaly Triage',           icon: '*', color: '#8b5cf6', desc: 'Classify in-flight event + reco.' },
  { path: '/ai/executive-brief',          title: 'AI · Executive Brief',          icon: '*', color: '#8b5cf6', desc: 'Operator-level snapshot.' },
  { path: '/ai/payload-weight-optimize',  title: 'AI · Payload Weight Optimize',  icon: '*', color: '#8b5cf6', desc: 'Pack drones within MTOW.' },
  { path: '/ai/battery-cycle-prognostic', title: 'AI · Battery Cycle Prognostic', icon: '*', color: '#8b5cf6', desc: 'Predict SoH and replacement.' },
  { path: '/ai/regulatory-checklist',     title: 'AI · Regulatory Checklist',     icon: '*', color: '#8b5cf6', desc: 'Part 135 + BVLOS compliance items.' },
  { path: '/ai/pilot-shift-schedule',     title: 'AI · Pilot Shift Schedule',     icon: '*', color: '#8b5cf6', desc: '7-day pilot rotation.' },
  { path: '/ai/ground-observer-plan',     title: 'AI · Ground Observer Plan',     icon: '*', color: '#8b5cf6', desc: 'Cover corridor blind spots.' },
  { path: '/ai/conflict-airspace-detect', title: 'AI · Conflict Airspace Detect', icon: '*', color: '#8b5cf6', desc: 'Detect zone conflicts on route.' },
  { path: '/ai/customer-comms-draft',     title: 'AI · Customer Comms Draft',     icon: '*', color: '#8b5cf6', desc: 'SMS / email / push drafts.' },
  { path: '/ai/vertiport-capacity-plan',  title: 'AI · Vertiport Capacity Plan',  icon: '*', color: '#8b5cf6', desc: 'Slot plan vs demand.' },
  { path: '/ai/contingency-landing-plan', title: 'AI · Contingency Landing Plan', icon: '*', color: '#8b5cf6', desc: 'Emergency landing zones.' },
  { path: '/ai/incident-post-mortem',     title: 'AI · Incident Post-Mortem',     icon: '*', color: '#8b5cf6', desc: 'Root cause + corrective actions.' },
  { path: '/ai/vendor-quality-score',     title: 'AI · Vendor Quality Score',     icon: '*', color: '#8b5cf6', desc: 'Score drone hardware suppliers.' },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    getDashboardStats().then(setStats).catch((e) => setErr(e.message));
  }, []);

  return (
    <div>
      <div className="dashboard-header">
        <h2>BVLOS Operations Dashboard</h2>
        <p>Part 135 last-mile drone delivery · {new Date().toUTCString()}</p>
      </div>

      {err && <div className="ai-error">Stats unavailable: {err}</div>}

      {stats && (
        <div className="stats-grid">
          <div className="stat"><div className="stat-label">Drones</div><div className="stat-value">{stats.drones?.total ?? '—'}</div><div className="stat-sub">{stats.drones?.ready ?? 0} ready · {stats.drones?.in_flight ?? 0} in flight</div></div>
          <div className="stat"><div className="stat-label">Batteries</div><div className="stat-value">{stats.batteries?.total ?? '—'}</div><div className="stat-sub">{stats.batteries?.available ?? 0} available · {stats.batteries?.retired ?? 0} retired</div></div>
          <div className="stat"><div className="stat-label">Flights</div><div className="stat-value">{stats.flights?.total ?? '—'}</div><div className="stat-sub">{stats.flights?.scheduled ?? 0} sched · {stats.flights?.in_flight ?? 0} flying · {stats.flights?.completed ?? 0} done</div></div>
          <div className="stat"><div className="stat-label">Missions</div><div className="stat-value">{stats.missions?.total ?? '—'}</div><div className="stat-sub">{stats.missions?.in_flight ?? 0} in flight</div></div>
          <div className="stat"><div className="stat-label">Customers</div><div className="stat-value">{stats.customers?.total ?? '—'}</div><div className="stat-sub">{stats.customers?.active ?? 0} active</div></div>
          <div className="stat"><div className="stat-label">Packages</div><div className="stat-value">{stats.packages?.total ?? '—'}</div><div className="stat-sub">{stats.packages?.in_transit ?? 0} in transit · {stats.packages?.delivered ?? 0} delivered</div></div>
          <div className="stat"><div className="stat-label">Depots</div><div className="stat-value">{stats.depots?.total ?? '—'}</div><div className="stat-sub">{stats.depots?.active ?? 0} active</div></div>
          <div className="stat"><div className="stat-label">Vertiports</div><div className="stat-value">{stats.vertiports?.total ?? '—'}</div><div className="stat-sub">{stats.vertiports?.active ?? 0} active · {stats.vertiports?.total_pads ?? 0} pads</div></div>
          <div className="stat"><div className="stat-label">Pilots</div><div className="stat-value">{stats.pilots?.total ?? '—'}</div><div className="stat-sub">{stats.pilots?.on_shift ?? 0} on shift</div></div>
          <div className="stat"><div className="stat-label">Observers</div><div className="stat-value">{stats.observers?.total ?? '—'}</div><div className="stat-sub">{stats.observers?.on_shift ?? 0} on shift</div></div>
          <div className="stat"><div className="stat-label">Approvals</div><div className="stat-value">{stats.regulatory_approvals?.total ?? '—'}</div><div className="stat-sub">{stats.regulatory_approvals?.approved ?? 0} approved · {stats.regulatory_approvals?.pending ?? 0} pending</div></div>
          <div className="stat"><div className="stat-label">Airspace</div><div className="stat-value">{stats.airspace_zones?.total ?? '—'}</div><div className="stat-sub">{stats.airspace_zones?.restricted ?? 0} restricted</div></div>
          <div className="stat"><div className="stat-label">Weather</div><div className="stat-value">{stats.weather_briefs?.total ?? '—'}</div><div className="stat-sub">{stats.weather_briefs?.go ?? 0} go · {stats.weather_briefs?.no_go ?? 0} no-go</div></div>
          <div className="stat"><div className="stat-label">Maint Logs</div><div className="stat-value">{stats.maintenance_logs?.total ?? '—'}</div><div className="stat-sub">logged</div></div>
          <div className="stat"><div className="stat-label">Incidents</div><div className="stat-value">{stats.incidents?.total ?? '—'}</div><div className="stat-sub">{stats.incidents?.open ?? 0} open · {stats.incidents?.critical ?? 0} critical</div></div>
          <div className="stat"><div className="stat-label">Corridors</div><div className="stat-value">{stats.route_corridors?.total ?? '—'}</div><div className="stat-sub">{stats.route_corridors?.active ?? 0} active</div></div>
          <div className="stat"><div className="stat-label">Payloads</div><div className="stat-value">{stats.payload_specs?.total ?? '—'}</div><div className="stat-sub">{stats.payload_specs?.hazmat ?? 0} hazmat</div></div>
          <div className="stat"><div className="stat-label">Audit</div><div className="stat-value">{stats.audit_log?.total ?? '—'}</div><div className="stat-sub">entries</div></div>
        </div>
      )}

      <h3 style={{ color: '#cbd5e1', margin: '8px 0 14px', fontSize: 15, textTransform: 'uppercase', letterSpacing: 1 }}>Capabilities</h3>
      <div className="feature-grid">
        {FEATURES.map((f) => (
          <div
            key={f.path}
            className="feature-card"
            style={{ ['--card-color']: f.color }}
            onClick={() => navigate(f.path)}
          >
            <div className="feature-card-icon" style={{ background: f.color + '22', color: f.color }}>{f.icon}</div>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
