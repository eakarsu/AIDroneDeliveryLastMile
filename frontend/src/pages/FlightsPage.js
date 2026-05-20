import React from 'react';
import CrudPage from '../components/CrudPage';
import { flightsApi } from '../services/api';

export default function FlightsPage() {
  return (
    <CrudPage
      title="Flights"
      subtitle="Scheduled, in-flight and completed BVLOS sorties."
      api={flightsApi}
      statusKey="status"
      fields={[
        { key: 'flight_id',  label: 'Flight ID' },
        { key: 'drone_id',   label: 'Drone' },
        { key: 'mission_id', label: 'Mission' },
        { key: 'takeoff_at', label: 'Takeoff',  type: 'datetime-local' },
        { key: 'landing_at', label: 'Landing',  type: 'datetime-local' },
        { key: 'status',     label: 'Status',   type: 'select', options: ['scheduled','in_flight','completed','aborted','diverted'] },
        { key: 'notes',      label: 'Notes',    type: 'textarea' },
      ]}
    />
  );
}
