import React from 'react';
import AIPage from '../components/AIPage';
import { aiExecutiveBrief } from '../services/api';

export default function AIExecutiveBriefPage() {
  return (
    <AIPage
      title="AI · Executive Brief"
      feature="executive-brief"
      subtitle="Fleet readiness, throughput, top risks and decisions required."
      inputs={[
        { key: 'notes', label: 'Bias / Focus Notes', type: 'textarea' },
      ]}
      run={(v) => aiExecutiveBrief(v)}
    />
  );
}
