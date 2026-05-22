import React, { useState } from 'react';
import CrudPage from '../components/CrudPage';
import { vertiportSlotsApi, getVertiportSlotConflicts } from '../services/api';

function ConflictPanel() {
  const [vp, setVp] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const run = async () => {
    setLoading(true); setError(null); setData(null);
    try {
      const d = await getVertiportSlotConflicts(vp.trim() || null);
      setData(d);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div style={{
      border: '1px solid #d0d5dc', borderRadius: 8, padding: 16, marginBottom: 20, background: '#f8fafc',
    }}>
      <h3 style={{ marginTop: 0 }}>Deterministic Conflict Detector</h3>
      <p style={{ margin: '4px 0 12px', fontSize: 13, color: '#475569' }}>
        Detects pad-collision windows on the same vertiport + pad_index. Rule-based, no AI.
        Leave the filter blank to scan all vertiports.
      </p>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
        <input
          placeholder="vertiport_id (e.g. VPT-001) — blank for all"
          value={vp}
          onChange={(e) => setVp(e.target.value)}
          style={{ flex: 1, padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: 6 }}
        />
        <button onClick={run} disabled={loading} className="btn">
          {loading ? 'Checking…' : 'Detect Conflicts'}
        </button>
      </div>
      {error && <div style={{ color: '#b91c1c', fontSize: 13 }}>Error: {error}</div>}
      {data && (
        <div style={{ fontSize: 13 }}>
          <div><strong>Scanned slots:</strong> {data.slot_count} · <strong>Conflicts:</strong> {data.conflict_count}</div>
          {data.conflicts.length > 0 && (
            <table style={{ width: '100%', marginTop: 8, fontSize: 12, borderCollapse: 'collapse' }}>
              <thead><tr style={{ background: '#e2e8f0' }}>
                <th align="left" style={{ padding: 4 }}>VPT</th>
                <th align="left" style={{ padding: 4 }}>Pad</th>
                <th align="left" style={{ padding: 4 }}>Slot A</th>
                <th align="left" style={{ padding: 4 }}>Slot B</th>
                <th align="right" style={{ padding: 4 }}>Overlap (s)</th>
                <th align="left" style={{ padding: 4 }}>Severity</th>
              </tr></thead>
              <tbody>
                {data.conflicts.map((c, i) => (
                  <tr key={i} style={{ borderTop: '1px solid #e2e8f0' }}>
                    <td style={{ padding: 4 }}>{c.a.vertiport_id}</td>
                    <td style={{ padding: 4 }}>{c.a.pad_index}</td>
                    <td style={{ padding: 4 }}>{c.a.slot_id} ({c.a.status})</td>
                    <td style={{ padding: 4 }}>{c.b.slot_id} ({c.b.status})</td>
                    <td align="right" style={{ padding: 4 }}>{c.overlap_seconds}</td>
                    <td style={{ padding: 4, color: c.severity === 'high' ? '#b91c1c' : c.severity === 'medium' ? '#b45309' : '#475569' }}>
                      {c.severity}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

export default function VertiportSlotsPage() {
  return (
    <div>
      <ConflictPanel />
      <CrudPage
        title="Vertiport Slots"
        subtitle="Scheduled pad reservations (arrival / departure / charging / reserved) per vertiport."
        api={vertiportSlotsApi}
        statusKey="status"
        fields={[
          { key: 'slot_id',      label: 'Slot ID' },
          { key: 'vertiport_id', label: 'Vertiport ID' },
          { key: 'pad_index',    label: 'Pad #', type: 'number' },
          { key: 'mission_id',   label: 'Mission ID' },
          { key: 'drone_id',     label: 'Drone ID' },
          { key: 'slot_type',    label: 'Type',  type: 'select', options: ['arrival','departure','charging','reserved'] },
          { key: 'window_start', label: 'Window Start', type: 'datetime-local' },
          { key: 'window_end',   label: 'Window End',   type: 'datetime-local' },
          { key: 'status',       label: 'Status', type: 'select', options: ['reserved','confirmed','cancelled','completed'] },
          { key: 'priority',     label: 'Priority', type: 'select', options: ['normal','priority','code_red'] },
          { key: 'notes',        label: 'Notes', type: 'textarea' },
        ]}
      />
    </div>
  );
}
