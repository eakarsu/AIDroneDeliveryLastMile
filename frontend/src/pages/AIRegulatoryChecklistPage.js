import React from 'react';
import AIPage from '../components/AIPage';
import { aiRegulatoryChecklist } from '../services/api';

export default function AIRegulatoryChecklistPage() {
  return (
    <AIPage
      title="AI · Regulatory Checklist"
      feature="regulatory-checklist"
      subtitle="Pre-flight Part 135 / BVLOS / Specific Cat compliance items."
      inputs={[
        { key: 'mission_id', label: 'Mission ID' },
        { key: 'authority',  label: 'Authority', type: 'select', options: ['FAA','RCAA','IAA','CAAS','GCAA','LBA','EASA'] },
      ]}
      run={(v) => aiRegulatoryChecklist(v)}
    />
  );
}
