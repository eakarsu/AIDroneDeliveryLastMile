import React from 'react';
import CrudPage from '../components/CrudPage';
import { incidentsApi } from '../services/api';

export default function IncidentsPage() {
  return (
    <CrudPage
      title="Incidents"
      subtitle="In-flight and ground events: C2 dropout, GPS loss, bird strike, parachute, etc."
      api={incidentsApi}
      statusKey="severity"
      fields={[
        { key: 'incident_id', label: 'Incident ID' },
        { key: 'flight_id',   label: 'Flight' },
        { key: 'type',        label: 'Type' },
        { key: 'severity',    label: 'Severity',  type: 'select', options: ['low','medium','high','critical'] },
        { key: 'opened_at',   label: 'Opened',    type: 'datetime-local' },
        { key: 'status',      label: 'Status',    type: 'select', options: ['open','investigating','closed'] },
        { key: 'notes',       label: 'Notes',     type: 'textarea' },
      ]}
    />
  );
}
