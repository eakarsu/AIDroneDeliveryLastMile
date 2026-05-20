import React from 'react';
import AIPage from '../components/AIPage';
import { aiPilotShiftSchedule } from '../services/api';

export default function AIPilotShiftSchedulePage() {
  return (
    <AIPage
      title="AI · Pilot Shift Schedule"
      feature="pilot-shift-schedule"
      subtitle="7-day rotation honoring rest rules and max stick time."
      inputs={[
        { key: 'constraints_notes', label: 'Constraints / Surge Notes', type: 'textarea' },
      ]}
      run={(v) => aiPilotShiftSchedule(v)}
    />
  );
}
