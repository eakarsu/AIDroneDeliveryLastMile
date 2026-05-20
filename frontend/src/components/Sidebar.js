import React from 'react';
import { NavLink } from 'react-router-dom';
import { logout, getStoredUser } from '../services/api';

// Menu groups per spec:
// Overview / Drones / Flights / Missions / Vertiports / Pilots / Regulatory / Governance / AI Planning / AI Operations / AI Reporting / Admin

const DRONES_LINKS = [
  { to: '/drones',           label: 'Drone Fleet' },
  { to: '/batteries',        label: 'Batteries' },
  { to: '/maintenance-logs', label: 'Maintenance Logs' },
];

const FLIGHTS_LINKS = [
  { to: '/flights',         label: 'Flights' },
  { to: '/incidents',       label: 'Incidents' },
  { to: '/weather-briefs',  label: 'Weather Briefs' },
];

const MISSIONS_LINKS = [
  { to: '/missions',        label: 'Missions' },
  { to: '/packages',        label: 'Packages' },
  { to: '/customers',       label: 'Customers' },
  { to: '/payload-specs',   label: 'Payload Specs' },
];

const VERTIPORTS_LINKS = [
  { to: '/depots',          label: 'Depots' },
  { to: '/vertiports',      label: 'Vertiports' },
  { to: '/route-corridors', label: 'Route Corridors' },
];

const PILOTS_LINKS = [
  { to: '/pilots',          label: 'Pilots' },
  { to: '/observers',       label: 'Observers' },
];

const REGULATORY_LINKS = [
  { to: '/regulatory-approvals', label: 'Regulatory Approvals' },
  { to: '/airspace-zones',       label: 'Airspace Zones' },
];

const GOVERNANCE_LINKS = [
  { to: '/audit-log',  label: 'Audit Log' },
];

const AI_PLANNING_LINKS = [
  { to: '/ai/route-corridor-plan',      label: 'AI · Route Corridor Plan' },
  { to: '/ai/weather-flight-window',    label: 'AI · Weather Flight Window' },
  { to: '/ai/mission-brief',            label: 'AI · Mission Brief' },
  { to: '/ai/payload-weight-optimize',  label: 'AI · Payload Weight Optimize' },
  { to: '/ai/regulatory-checklist',     label: 'AI · Regulatory Checklist' },
  { to: '/ai/pilot-shift-schedule',     label: 'AI · Pilot Shift Schedule' },
];

const AI_OPERATIONS_LINKS = [
  { to: '/ai/anomaly-triage',           label: 'AI · Anomaly Triage' },
  { to: '/ai/ground-observer-plan',     label: 'AI · Ground Observer Plan' },
  { to: '/ai/conflict-airspace-detect', label: 'AI · Conflict Airspace Detect' },
  { to: '/ai/vertiport-capacity-plan',  label: 'AI · Vertiport Capacity Plan' },
  { to: '/ai/contingency-landing-plan', label: 'AI · Contingency Landing Plan' },
  { to: '/ai/customer-comms-draft',     label: 'AI · Customer Comms Draft' },
];

const AI_REPORTING_LINKS = [
  { to: '/ai/executive-brief',         label: 'AI · Executive Brief' },
  { to: '/ai/battery-cycle-prognostic',label: 'AI · Battery Cycle Prognostic' },
  { to: '/ai/incident-post-mortem',    label: 'AI · Incident Post-Mortem' },
  { to: '/ai/vendor-quality-score',    label: 'AI · Vendor Quality Score' },
];

export default function Sidebar() {
  const user = getStoredUser();
  return (
    <nav className="sidebar">
      <div className="sidebar-brand">
        <h1>DRONE DELIVERY</h1>
        <p>BVLOS Last-Mile Operations</p>
      </div>

      <div className="sidebar-group-label">Overview</div>
      <NavLink to="/" end>Operations Dashboard</NavLink>
      <NavLink to="/custom-views">Flight Views</NavLink>

      <div className="sidebar-group-label">Drones</div>
      {DRONES_LINKS.map((l) => (
        <NavLink key={l.to} to={l.to}>{l.label}</NavLink>
      ))}

      <div className="sidebar-group-label">Flights</div>
      {FLIGHTS_LINKS.map((l) => (
        <NavLink key={l.to} to={l.to}>{l.label}</NavLink>
      ))}

      <div className="sidebar-group-label">Missions</div>
      {MISSIONS_LINKS.map((l) => (
        <NavLink key={l.to} to={l.to}>{l.label}</NavLink>
      ))}

      <div className="sidebar-group-label">Vertiports</div>
      {VERTIPORTS_LINKS.map((l) => (
        <NavLink key={l.to} to={l.to}>{l.label}</NavLink>
      ))}

      <div className="sidebar-group-label">Pilots</div>
      {PILOTS_LINKS.map((l) => (
        <NavLink key={l.to} to={l.to}>{l.label}</NavLink>
      ))}

      <div className="sidebar-group-label">Regulatory</div>
      {REGULATORY_LINKS.map((l) => (
        <NavLink key={l.to} to={l.to}>{l.label}</NavLink>
      ))}

      <div className="sidebar-group-label">Governance</div>
      {GOVERNANCE_LINKS.map((l) => (
        <NavLink key={l.to} to={l.to}>{l.label}</NavLink>
      ))}

      <div className="sidebar-group-label">AI Planning</div>
      {AI_PLANNING_LINKS.map((l) => (
        <NavLink key={l.to} to={l.to}>{l.label}</NavLink>
      ))}

      <div className="sidebar-group-label">AI Operations</div>
      {AI_OPERATIONS_LINKS.map((l) => (
        <NavLink key={l.to} to={l.to}>{l.label}</NavLink>
      ))}

      <div className="sidebar-group-label">AI Reporting</div>
      {AI_REPORTING_LINKS.map((l) => (
        <NavLink key={l.to} to={l.to}>{l.label}</NavLink>
      ))}

      <div className="sidebar-group-label">Admin</div>
      <NavLink to="/webhooks">Webhooks</NavLink>

      <div className="sidebar-user">
        {user && (
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user.name || user.email}</div>
            <div className="sidebar-user-role">{user.role || 'user'}</div>
          </div>
        )}
        <button className="btn secondary sidebar-logout" onClick={logout}>Sign Out</button>
      </div>
    </nav>
  );
}
