import React from 'react';
import CrudPage from '../components/CrudPage';
import { maintenanceLogsApi } from '../services/api';

export default function MaintenanceLogsPage() {
  return (
    <CrudPage
      title="Maintenance Logs"
      subtitle="Drone airframe / motor / parachute work records."
      api={maintenanceLogsApi}
      fields={[
        { key: 'log_id',       label: 'Log ID' },
        { key: 'drone_id',     label: 'Drone' },
        { key: 'work',         label: 'Work' },
        { key: 'technician',   label: 'Technician' },
        { key: 'hours',        label: 'Hours',     type: 'number' },
        { key: 'completed_at', label: 'Completed', type: 'datetime-local' },
        { key: 'notes',        label: 'Notes',     type: 'textarea' },
      ]}
    />
  );
}
