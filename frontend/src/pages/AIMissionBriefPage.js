import React from 'react';
import AIPage from '../components/AIPage';
import { aiMissionBrief } from '../services/api';

export default function AIMissionBriefPage() {
  return (
    <AIPage
      title="AI · Mission Brief"
      feature="mission-brief"
      subtitle="Pre-flight brief with drone, payload, weather, regulatory and abort criteria."
      inputs={[
        { key: 'mission_id',    label: 'Mission ID' },
        { key: 'context_notes', label: 'Context Notes', type: 'textarea' },
      ]}
      run={(v) => aiMissionBrief(v)}
    />
  );
}
