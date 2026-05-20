import React from 'react';
import CrudPage from '../components/CrudPage';
import { airspaceZonesApi } from '../services/api';

export default function AirspaceZonesPage() {
  return (
    <CrudPage
      title="Airspace Zones"
      subtitle="Class B/C/D, CTRs, TMAs and TFRs intersecting delivery corridors."
      api={airspaceZonesApi}
      statusKey="status"
      fields={[
        { key: 'zone_id',        label: 'Zone ID' },
        { key: 'name',           label: 'Name' },
        { key: 'classification', label: 'Class' },
        { key: 'region',         label: 'Region' },
        { key: 'restrictions',   label: 'Restrictions', type: 'textarea' },
        { key: 'status',         label: 'Status',       type: 'select', options: ['active','restricted','inactive'] },
        { key: 'notes',          label: 'Notes',        type: 'textarea' },
      ]}
    />
  );
}
