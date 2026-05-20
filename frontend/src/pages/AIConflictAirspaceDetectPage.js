import React from 'react';
import AIPage from '../components/AIPage';
import { aiConflictAirspaceDetect } from '../services/api';

function parseJson(v) { try { return JSON.parse(v); } catch (_) { return undefined; } }

export default function AIConflictAirspaceDetectPage() {
  return (
    <AIPage
      title="AI · Conflict Airspace Detect"
      feature="conflict-airspace-detect"
      subtitle="Find airspace conflicts along a planned route + deconfliction actions."
      inputs={[
        { key: 'route_notes', label: 'Route Description', type: 'textarea' },
        { key: 'zones_json',  label: 'Airspace Zones (JSON array)', type: 'textarea' },
      ]}
      run={(v) => aiConflictAirspaceDetect({
        route_notes: v.route_notes,
        zones: parseJson(v.zones_json),
      })}
    />
  );
}
