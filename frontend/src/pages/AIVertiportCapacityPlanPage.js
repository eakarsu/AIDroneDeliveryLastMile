import React from 'react';
import AIPage from '../components/AIPage';
import { aiVertiportCapacityPlan } from '../services/api';

export default function AIVertiportCapacityPlanPage() {
  return (
    <AIPage
      title="AI · Vertiport Capacity Plan"
      feature="vertiport-capacity-plan"
      subtitle="Slot plan + bottlenecks for a vertiport under forecasted demand."
      inputs={[
        { key: 'vertiport_id', label: 'Vertiport ID' },
        { key: 'demand_notes', label: 'Demand Notes', type: 'textarea' },
      ]}
      run={(v) => aiVertiportCapacityPlan(v)}
    />
  );
}
