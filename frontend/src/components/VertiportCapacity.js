import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid,
} from 'recharts';
import { API_BASE, getToken } from '../services/api';

export default function VertiportCapacity() {
  const [rows, setRows] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    const token = getToken();
    fetch(`${API_BASE}/custom-views/vertiport-capacity`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => r.json())
      .then((d) => setRows(Array.isArray(d) ? d : []))
      .catch((e) => setErr(e.message));
  }, []);

  if (err)          return <div style={{ padding: 16, color: '#dc2626' }}>Capacity error: {err}</div>;
  if (!rows)        return <div style={{ padding: 16, color: '#94a3b8' }}>Loading vertiport capacity…</div>;
  if (!rows.length) return <div style={{ padding: 16, color: '#94a3b8' }}>No vertiports found.</div>;

  const data = rows.map((r) => ({
    vertiport: r.vertiport_id,
    Utilized:  Number(r.utilized) || 0,
    Capacity:  Number(r.capacity) || 0,
  }));

  return (
    <div style={{ background: '#0f172a', borderRadius: 12, padding: 16, border: '1px solid #1e293b' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ margin: 0, color: '#e2e8f0' }}>Vertiport Capacity</h3>
        <div style={{ fontSize: 12, color: '#94a3b8' }}>{rows.length} vertiports</div>
      </div>
      <div style={{ width: '100%', height: 340 }}>
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 24 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="vertiport" stroke="#94a3b8" angle={-35} textAnchor="end" interval={0} height={60} />
            <YAxis stroke="#94a3b8" allowDecimals={false} />
            <Tooltip
              contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 6 }}
              labelStyle={{ color: '#e2e8f0' }}
            />
            <Legend wrapperStyle={{ color: '#e2e8f0' }} />
            <Bar dataKey="Capacity" fill="#334155" radius={[6, 6, 0, 0]} />
            <Bar dataKey="Utilized" fill="#10b981" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
