import React from 'react';
import AIPage from '../components/AIPage';
import { aiContingencyLandingPlan } from '../services/api';

export default function AIContingencyLandingPlanPage() {
  return (
    <AIPage
      title="AI · Contingency Landing Plan"
      feature="contingency-landing-plan"
      subtitle="Primary + alternate emergency landing zones + fail-safe logic."
      inputs={[
        { key: 'route_notes', label: 'Route Description', type: 'textarea' },
        { key: 'drone_spec',  label: 'Drone Spec',        type: 'textarea' },
      ]}
      run={(v) => aiContingencyLandingPlan(v)}
    />
  );
}
