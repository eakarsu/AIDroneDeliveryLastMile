import React from 'react';
import AIPage from '../components/AIPage';
import { aiWeightBalanceAdvise } from '../services/api';

export default function AIWeightBalanceAdvisePage() {
  return (
    <AIPage
      title="AI · Weight & Balance Advisor"
      feature="weight-balance-advise"
      subtitle="CG calculation and load placement guidance for multi-package payloads."
      inputs={[
        { key: 'payloads_json', label: 'Payloads (JSON array)', type: 'textarea',
          placeholder: '[{ "package_id": "PKG-...", "weight_kg": 1.2, "bay_preference": "forward" }]' },
        { key: 'drone_spec',    label: 'Drone Spec / CG Envelope', type: 'textarea' },
      ]}
      run={(v) => aiWeightBalanceAdvise(v)}
    />
  );
}
