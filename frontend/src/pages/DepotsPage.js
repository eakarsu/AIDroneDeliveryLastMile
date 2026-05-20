import React from 'react';
import CrudPage from '../components/CrudPage';
import { depotsApi } from '../services/api';

export default function DepotsPage() {
  return (
    <CrudPage
      title="Depots"
      subtitle="Distribution depots and regional hubs."
      api={depotsApi}
      statusKey="status"
      fields={[
        { key: 'depot_id', label: 'Depot ID' },
        { key: 'name',     label: 'Name' },
        { key: 'location', label: 'Location' },
        { key: 'capacity', label: 'Capacity', type: 'number' },
        { key: 'status',   label: 'Status',   type: 'select', options: ['active','maintenance','offline'] },
        { key: 'manager',  label: 'Manager' },
        { key: 'notes',    label: 'Notes',    type: 'textarea' },
      ]}
    />
  );
}
