import React from 'react';
import CrudPage from '../components/CrudPage';
import { routeCorridorsApi } from '../services/api';

export default function RouteCorridorsPage() {
  return (
    <CrudPage
      title="Route Corridors"
      subtitle="Approved BVLOS corridors between depots / vertiports and destinations."
      api={routeCorridorsApi}
      statusKey="status"
      fields={[
        { key: 'corridor_id',    label: 'Corridor ID' },
        { key: 'name',           label: 'Name' },
        { key: 'region',         label: 'Region' },
        { key: 'start_location', label: 'Start' },
        { key: 'end_location',   label: 'End' },
        { key: 'status',         label: 'Status', type: 'select', options: ['active','suspended','retired'] },
        { key: 'notes',          label: 'Notes',  type: 'textarea' },
      ]}
    />
  );
}
