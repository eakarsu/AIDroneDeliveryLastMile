import React from 'react';
import AIPage from '../components/AIPage';
import { aiIncidentPostMortem } from '../services/api';

export default function AIIncidentPostMortemPage() {
  return (
    <AIPage
      title="AI · Incident Post-Mortem"
      feature="incident-post-mortem"
      subtitle="Root cause, timeline, corrective actions and reportable bodies."
      inputs={[
        { key: 'incident_id', label: 'Incident ID' },
        { key: 'notes',       label: 'Investigator Notes', type: 'textarea' },
      ]}
      run={(v) => aiIncidentPostMortem(v)}
    />
  );
}
