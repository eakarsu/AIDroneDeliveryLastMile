import React, { useState } from 'react';
import {
  autonomyBvlosFeasibility,
  autonomyRtlArbiter,
  autonomySwarmDeconflict,
  autonomyGeofenceAdvise,
  autonomyEnergyBudget,
  autonomyDensityBundle,
} from '../services/api';

// ADVISORY ONLY — none of these endpoints command a drone or alter live
// tasking. Every response carries `advisory_only: true`. The audit note flagged
// these as TOO-RISKY for autonomous execution; this page exposes them as
// decision-support tools for a remote pilot in command.

function AdvisoryCard({ title, description, defaults, callFn }) {
  const [body, setBody] = useState(JSON.stringify(defaults, null, 2));
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true); setError(null); setResult(null);
    try {
      let parsed = {};
      try { parsed = JSON.parse(body); } catch (e) { throw new Error('Body is not valid JSON'); }
      const r = await callFn(parsed);
      setResult(r);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ border: '1px solid #d0d5dc', borderRadius: 8, padding: 16, marginBottom: 16, background: '#fff' }}>
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      <p style={{ margin: '4px 0 8px', color: '#475569', fontSize: 13 }}>{description}</p>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        style={{
          width: '100%', minHeight: 110, fontFamily: 'monospace', fontSize: 12,
          padding: 8, border: '1px solid #cbd5e1', borderRadius: 6, marginBottom: 8,
        }}
      />
      <button onClick={run} disabled={loading} className="btn">
        {loading ? 'Running…' : 'Run Advisory'}
      </button>
      {error && <div style={{ color: '#b91c1c', marginTop: 8, fontSize: 13 }}>Error: {error}</div>}
      {result && (
        <pre style={{
          marginTop: 12, padding: 10, background: '#0f172a', color: '#e2e8f0',
          borderRadius: 6, fontSize: 12, overflowX: 'auto',
        }}>{JSON.stringify(result, null, 2)}</pre>
      )}
    </div>
  );
}

export default function AutonomyAdvisoryPage() {
  return (
    <div>
      <h1 style={{ marginBottom: 4 }}>Autonomy · Advisory Tools</h1>
      <div style={{
        background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: 8,
        padding: 12, marginBottom: 16, fontSize: 13, color: '#78350f',
      }}>
        <strong>Advisory only.</strong> None of these tools command a drone or alter live tasking.
        A remote pilot in command must review every recommendation before any action is taken.
        Per audit note, BVLOS, RTL, and swarm deconfliction are flagged TOO-RISKY for autonomous execution.
      </div>

      <AdvisoryCard
        title="BVLOS Feasibility Score"
        description="Deterministic feasibility scoring for a BVLOS corridor."
        defaults={{ corridor_km: 12, observers_count: 2, waiver_active: true, comms_relays: 1, urban_density: 'suburban' }}
        callFn={autonomyBvlosFeasibility}
      />
      <AdvisoryCard
        title="Return-to-Launch Arbiter"
        description="Recommends continue / divert / RTL / land / parachute from battery, comms, wind, distance."
        defaults={{ battery_pct: 42, comms_link_ok: true, wind_kt: 16, distance_home_km: 6, payload_critical: false }}
        callFn={autonomyRtlArbiter}
      />
      <AdvisoryCard
        title="Swarm Deconfliction"
        description="Coarse 4D proximity check across multiple drone trajectories (1-min buckets, 200m / 30m thresholds)."
        defaults={{
          trajectories: [
            { drone_id: 'DRN-001', waypoints: [{ lat: 35.2271, lon: -80.8431, alt_m: 90, t_iso: '2026-05-21T14:00:00Z' }] },
            { drone_id: 'DRN-002', waypoints: [{ lat: 35.2272, lon: -80.8432, alt_m: 92, t_iso: '2026-05-21T14:00:30Z' }] },
          ],
        }}
        callFn={autonomySwarmDeconflict}
      />
      <AdvisoryCard
        title="Geofence Advisor"
        description="Recommends corridor half-width and sensitive-feature buffers."
        defaults={{ route_centerline_km: 8, school_count: 3, hospital_count: 1, population_density: 'urban' }}
        callFn={autonomyGeofenceAdvise}
      />
      <AdvisoryCard
        title="Energy Budget Optimizer"
        description="Computes throughput-per-hour for swap vs charge ops."
        defaults={{ fleet_size: 12, avg_cycle_hours: 0.5, swap_pack_count: 8, vertiport_chargers: 4 }}
        callFn={autonomyEnergyBudget}
      />
      <AdvisoryCard
        title="Delivery-density Route Bundling"
        description="Cluster orders by geographic density into shared corridors."
        defaults={{
          cluster_radius_km: 1.5, max_payload_kg: 4.0,
          orders: [
            { order_id: 'ORD-001', lat: 35.227, lon: -80.843, weight_kg: 0.9 },
            { order_id: 'ORD-002', lat: 35.228, lon: -80.844, weight_kg: 0.8 },
            { order_id: 'ORD-003', lat: 35.241, lon: -80.821, weight_kg: 1.2 },
          ],
        }}
        callFn={autonomyDensityBundle}
      />
    </div>
  );
}
