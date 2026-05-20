import React from 'react';
import CrudPage from '../components/CrudPage';
import { dronesApi } from '../services/api';

export default function DronesPage() {
  return (
    <CrudPage
      title="Drone Fleet"
      subtitle="Airframes available for BVLOS last-mile operations."
      api={dronesApi}
      statusKey="status"
      fields={[
        { key: 'drone_id',           label: 'Drone ID' },
        { key: 'model',              label: 'Model' },
        { key: 'sn',                 label: 'Serial' },
        { key: 'battery_count',      label: 'Batteries', type: 'number' },
        { key: 'total_flight_hours', label: 'Flt Hours', type: 'number' },
        { key: 'status',             label: 'Status',    type: 'select', options: ['ready','in_flight','maintenance','offline'] },
        { key: 'notes',              label: 'Notes',     type: 'textarea' },
      ]}
    />
  );
}
