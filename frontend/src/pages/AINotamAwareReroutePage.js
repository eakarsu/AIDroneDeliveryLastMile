import React from 'react';
import AIPage from '../components/AIPage';
import { aiNotamAwareReroute } from '../services/api';

export default function AINotamAwareReroutePage() {
  return (
    <AIPage
      title="AI · NOTAM-aware Reroute"
      feature="notam-aware-reroute"
      subtitle="Re-optimize a planned corridor against live NOTAMs / TFRs. (Live feed ingestion is NEEDS-CREDS — wire NOTAM_API_KEY in .env to auto-pull.)"
      inputs={[
        { key: 'route_notes', label: 'Route Notes', type: 'textarea' },
        { key: 'notams_json', label: 'NOTAMs (JSON array)', type: 'textarea',
          placeholder: '[{ "notam_id": "A1234/26", "summary": "...", "severity": "high" }]' },
        { key: 'drone_spec',  label: 'Drone Spec', type: 'textarea' },
      ]}
      run={(v) => aiNotamAwareReroute(v)}
    />
  );
}
