import React from 'react';
import AIPage from '../components/AIPage';
import { aiCustomerCommsDraft } from '../services/api';

export default function AICustomerCommsDraftPage() {
  return (
    <AIPage
      title="AI · Customer Comms Draft"
      feature="customer-comms-draft"
      subtitle="Draft an SMS / email / app push for a delivery event."
      inputs={[
        { key: 'event_type', label: 'Event Type', type: 'select', options: ['delivery_complete','weather_delay','mission_aborted','drone_dispatched','priority_confirmed'] },
        { key: 'mission_id', label: 'Mission ID' },
        { key: 'extra_notes',label: 'Extra Notes', type: 'textarea' },
      ]}
      run={(v) => aiCustomerCommsDraft(v)}
    />
  );
}
