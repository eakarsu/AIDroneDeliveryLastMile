import React from 'react';
import CrudPage from '../components/CrudPage';
import { pilotsApi } from '../services/api';

export default function PilotsPage() {
  return (
    <CrudPage
      title="Pilots"
      subtitle="Remote pilots, licenses and BVLOS / VLOS certifications."
      api={pilotsApi}
      statusKey="status"
      fields={[
        { key: 'pilot_id',       label: 'Pilot ID' },
        { key: 'name',           label: 'Name' },
        { key: 'license',        label: 'License' },
        { key: 'certifications', label: 'Certifications' },
        { key: 'base',           label: 'Base' },
        { key: 'status',         label: 'Status', type: 'select', options: ['active','on_shift','leave','training','inactive'] },
        { key: 'notes',          label: 'Notes',  type: 'textarea' },
      ]}
    />
  );
}
