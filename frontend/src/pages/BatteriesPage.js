import React from 'react';
import CrudPage from '../components/CrudPage';
import { batteriesApi } from '../services/api';

export default function BatteriesPage() {
  return (
    <CrudPage
      title="Batteries"
      subtitle="LiPo / Li-ion battery packs, cycle counts and state-of-health."
      api={batteriesApi}
      statusKey="status"
      fields={[
        { key: 'battery_id',  label: 'Battery ID' },
        { key: 'drone_id',    label: 'Drone' },
        { key: 'cycles',      label: 'Cycles',  type: 'number' },
        { key: 'soh_pct',     label: 'SoH %',   type: 'number' },
        { key: 'last_charge', label: 'Charged', type: 'datetime-local' },
        { key: 'status',      label: 'Status',  type: 'select', options: ['available','in_use','charging','maintenance','retired'] },
        { key: 'notes',       label: 'Notes',   type: 'textarea' },
      ]}
    />
  );
}
