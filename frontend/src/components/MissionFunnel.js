import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList,
} from 'recharts';
import { API_BASE, getToken } from '../services/api';

export default function MissionFunnel() {
  const [payload, setPayload] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    const token = getToken();
    fetch(`${API_BASE}/custom-views/mission-funnel`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => r.json())
      .then(setPayload)
      .catch((e) => setErr(e.message));
  }, []);

  if (err)     return <div style={{ padding: 16, color: '#dc2626' }}>Funnel error: {err}</div>;
  if (!payload) return <div style={{ padding: 16, color: '#94a3b8' }}>Loading mission funnel…</div>;

  const stages = payload.stages || [];
  const max = Math.max(1, ...stages.map((s) => s.value));

  return (
    <div style={{ background: '#0f172a', borderRadius: 12, padding: 16, border: '1px solid #1e293b' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ margin: 0, color: '#e2e8f0' }}>Mission Status Funnel</h3>
        <div style={{ fontSize: 12, color: '#94a3b8' }}>{payload.total || 0} missions total</div>
      </div>
      <div style={{ width: '100%', height: 320 }}>
        <ResponsiveContainer>
          <BarChart
            data={stages}
            layout="vertical"
            margin={{ top: 8, right: 32, left: 24, bottom: 8 }}
            barCategoryGap={12}
          >
            <XAxis type="number" stroke="#94a3b8" domain={[0, max]} />
            <YAxis dataKey="stage" type="category" stroke="#94a3b8" width={90} />
            <Tooltip
              contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 6 }}
              labelStyle={{ color: '#e2e8f0' }}
            />
            <Bar dataKey="value" radius={[0, 8, 8, 0]}>
              {stages.map((s, i) => (
                <Cell key={i} fill={s.fill} />
              ))}
              <LabelList dataKey="value" position="right" fill="#e2e8f0" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
