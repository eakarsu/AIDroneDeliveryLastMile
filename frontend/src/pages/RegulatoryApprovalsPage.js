import React from 'react';
import CrudPage from '../components/CrudPage';
import { regulatoryApprovalsApi } from '../services/api';

export default function RegulatoryApprovalsPage() {
  return (
    <CrudPage
      title="Regulatory Approvals"
      subtitle="FAA / RCAA / IAA / CAAS / GCAA Part 135 + BVLOS waivers."
      api={regulatoryApprovalsApi}
      statusKey="status"
      fields={[
        { key: 'approval_id', label: 'Approval ID' },
        { key: 'mission_id',  label: 'Mission' },
        { key: 'authority',   label: 'Authority' },
        { key: 'type',        label: 'Type' },
        { key: 'status',      label: 'Status', type: 'select', options: ['pending','approved','suspended','denied'] },
        { key: 'issued_at',   label: 'Issued', type: 'date' },
        { key: 'notes',       label: 'Notes',  type: 'textarea' },
      ]}
    />
  );
}
