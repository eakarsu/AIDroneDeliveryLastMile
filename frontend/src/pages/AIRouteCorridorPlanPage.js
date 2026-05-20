import React from 'react';
import AIPage from '../components/AIPage';
import { aiRouteCorridorPlan } from '../services/api';

export default function AIRouteCorridorPlanPage() {
  return (
    <AIPage
      title="AI · Route Corridor Plan"
      feature="route-corridor-plan"
      subtitle="Generate a BVLOS route corridor with alternates, no-fly zones and observer posts."
      inputs={[
        { key: 'origin',        label: 'Origin' },
        { key: 'destination',   label: 'Destination' },
        { key: 'context_notes', label: 'Context Notes', type: 'textarea' },
      ]}
      run={(v) => aiRouteCorridorPlan(v)}
    />
  );
}
