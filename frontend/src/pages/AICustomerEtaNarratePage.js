import React from 'react';
import AIPage from '../components/AIPage';
import { aiCustomerEtaNarrate } from '../services/api';

export default function AICustomerEtaNarratePage() {
  return (
    <AIPage
      title="AI · Customer ETA Narrator"
      feature="customer-eta-narrate"
      subtitle="Generate a customer-friendly ETA narration tied to live in-flight progress."
      inputs={[
        { key: 'mission_id',             label: 'Mission ID' },
        { key: 'phase',                  label: 'Flight Phase', type: 'select', options: ['preflight','climb','cruise','approach','landing','completed','aborted'] },
        { key: 'distance_remaining_km', label: 'Distance Remaining (km)', type: 'number' },
        { key: 'wind_kt',                label: 'Wind (kt)', type: 'number' },
        { key: 'notes',                  label: 'Notes', type: 'textarea' },
      ]}
      run={(v) => aiCustomerEtaNarrate(v)}
    />
  );
}
