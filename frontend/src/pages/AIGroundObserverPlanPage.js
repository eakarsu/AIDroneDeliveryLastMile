import React from 'react';
import AIPage from '../components/AIPage';
import { aiGroundObserverPlan } from '../services/api';

export default function AIGroundObserverPlanPage() {
  return (
    <AIPage
      title="AI · Ground Observer Plan"
      feature="ground-observer-plan"
      subtitle="Place visual observers to cover BVLOS corridor blind spots."
      inputs={[
        { key: 'corridor_notes', label: 'Corridor Notes', type: 'textarea' },
        { key: 'mission_id',     label: 'Mission ID (optional)' },
      ]}
      run={(v) => aiGroundObserverPlan(v)}
    />
  );
}
