import React from 'react';
import AIPage from '../components/AIPage';
import { aiAnomalyTriage } from '../services/api';

export default function AIAnomalyTriagePage() {
  return (
    <AIPage
      title="AI · Anomaly Triage"
      feature="anomaly-triage"
      subtitle="Classify an in-flight event and recommend continue / divert / RTH / parachute."
      inputs={[
        { key: 'telemetry_notes', label: 'Telemetry / Event Notes', type: 'textarea' },
      ]}
      run={(v) => aiAnomalyTriage(v)}
    />
  );
}
