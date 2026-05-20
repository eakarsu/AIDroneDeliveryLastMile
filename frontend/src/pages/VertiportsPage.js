import React from 'react';
import CrudPage from '../components/CrudPage';
import { vertiportsApi } from '../services/api';

export default function VertiportsPage() {
  return (
    <CrudPage
      title="Vertiports"
      subtitle="VTOL takeoff / landing facilities and pad capacity."
      api={vertiportsApi}
      statusKey="status"
      fields={[
        { key: 'vertiport_id', label: 'Vertiport ID' },
        { key: 'depot_id',     label: 'Depot' },
        { key: 'location',     label: 'Location' },
        { key: 'pad_count',    label: 'Pads', type: 'number' },
        { key: 'status',       label: 'Status', type: 'select', options: ['active','maintenance','offline'] },
        { key: 'operator',     label: 'Operator' },
        { key: 'notes',        label: 'Notes', type: 'textarea' },
      ]}
    />
  );
}
