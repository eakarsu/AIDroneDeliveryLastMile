import React, { useEffect, useState } from 'react';
import {
  RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis,
} from 'recharts';
import { API_BASE, getToken } from '../services/api';

function colorFor(soh) {
  if (soh >= 85) return '#10b981';
  if (soh >= 70) return '#22c55e';
  if (soh >= 55) return '#f59e0b';
  return '#ef4444';
}

function DroneTile({ drone }) {
  const soh = Math.max(0, Math.min(100, Math.round(Number(drone.soh_pct) || 0)));
  const fill = colorFor(soh);
  const data = [{ name: drone.drone_id, value: soh, fill }];

  return (
    <div style={{
      background: '#0f172a',
      border: '1px solid #1e293b',
      borderRadius: 10,
      padding: 10,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}>
      <div style={{ width: '100%', height: 140, position: 'relative' }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            innerRadius="65%"
            outerRadius="100%"
            data={data}
            startAngle={90}
            endAngle={-270}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
            <RadialBar dataKey="value" cornerRadius={6} background={{ fill: '#1e293b' }} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none',
        }}>
          <div style={{ color: fill, fontSize: 22, fontWeight: 700 }}>{soh}%</div>
          <div style={{ color: '#94a3b8', fontSize: 10 }}>SoH</div>
        </div>
      </div>
      <div style={{ marginTop: 4, color: '#e2e8f0', fontSize: 12, fontWeight: 600, textAlign: 'center' }}>
        {drone.drone_id}
      </div>
      <div style={{ color: '#94a3b8', fontSize: 10, textAlign: 'center' }}>
        {drone.model || '—'} · {drone.cycles}c
      </div>
    </div>
  );
}

export default function DroneBatteryGrid() {
  const [drones, setDrones] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    const token = getToken();
    fetch(`${API_BASE}/custom-views/drone-batteries`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => r.json())
      .then((d) => setDrones(Array.isArray(d) ? d : []))
      .catch((e) => setErr(e.message));
  }, []);

  if (err)            return <div style={{ padding: 16, color: '#dc2626' }}>Battery grid error: {err}</div>;
  if (!drones)        return <div style={{ padding: 16, color: '#94a3b8' }}>Loading drone batteries…</div>;
  if (!drones.length) return <div style={{ padding: 16, color: '#94a3b8' }}>No drones found.</div>;

  return (
    <div style={{ background: '#0f172a', borderRadius: 12, padding: 16, border: '1px solid #1e293b' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ margin: 0, color: '#e2e8f0' }}>Drone Battery Status</h3>
        <div style={{ fontSize: 12, color: '#94a3b8' }}>{drones.length} drones</div>
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
        gap: 12,
      }}>
        {drones.map((d) => <DroneTile key={d.id} drone={d} />)}
      </div>
    </div>
  );
}
