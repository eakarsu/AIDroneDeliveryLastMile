import React from 'react';
import CrudPage from '../components/CrudPage';
import { observersApi } from '../services/api';

export default function ObserversPage() {
  return (
    <CrudPage
      title="Visual Observers"
      subtitle="Ground observers covering BVLOS corridor blind spots."
      api={observersApi}
      statusKey="status"
      fields={[
        { key: 'observer_id',    label: 'Observer ID' },
        { key: 'name',           label: 'Name' },
        { key: 'location',       label: 'Location' },
        { key: 'certifications', label: 'Certifications' },
        { key: 'status',         label: 'Status', type: 'select', options: ['active','on_shift','leave','inactive'] },
        { key: 'contact',        label: 'Contact' },
        { key: 'notes',          label: 'Notes',  type: 'textarea' },
      ]}
    />
  );
}
