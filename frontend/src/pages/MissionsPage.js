import React from 'react';
import CrudPage from '../components/CrudPage';
import { missionsApi } from '../services/api';

export default function MissionsPage() {
  return (
    <CrudPage
      title="Missions"
      subtitle="Pickup-to-dropoff last-mile delivery missions."
      api={missionsApi}
      statusKey="status"
      fields={[
        { key: 'mission_id',  label: 'Mission ID' },
        { key: 'customer_id', label: 'Customer' },
        { key: 'pickup',      label: 'Pickup' },
        { key: 'dropoff',     label: 'Dropoff' },
        { key: 'payload_kg',  label: 'Payload (kg)', type: 'number' },
        { key: 'status',      label: 'Status', type: 'select', options: ['planning','scheduled','in_flight','completed','aborted'] },
        { key: 'notes',       label: 'Notes',  type: 'textarea' },
      ]}
    />
  );
}
