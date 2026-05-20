import React from 'react';
import CrudPage from '../components/CrudPage';
import { packagesApi } from '../services/api';

export default function PackagesPage() {
  return (
    <CrudPage
      title="Packages"
      subtitle="Individual payloads tied to a mission."
      api={packagesApi}
      statusKey="status"
      fields={[
        { key: 'package_id',    label: 'Package ID' },
        { key: 'mission_id',    label: 'Mission' },
        { key: 'weight_kg',     label: 'Weight (kg)', type: 'number' },
        { key: 'contents_type', label: 'Contents' },
        { key: 'destination',   label: 'Destination' },
        { key: 'status',        label: 'Status', type: 'select', options: ['pending','in_transit','delivered','returned'] },
        { key: 'notes',         label: 'Notes',  type: 'textarea' },
      ]}
    />
  );
}
