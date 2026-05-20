import React from 'react';
import CrudPage from '../components/CrudPage';
import { payloadSpecsApi } from '../services/api';

export default function PayloadSpecsPage() {
  return (
    <CrudPage
      title="Payload Specs"
      subtitle="Max weight, dimensions and hazmat handling per payload type."
      api={payloadSpecsApi}
      statusKey="status"
      fields={[
        { key: 'spec_id',       label: 'Spec ID' },
        { key: 'payload_type',  label: 'Payload Type' },
        { key: 'max_weight_kg', label: 'Max kg', type: 'number' },
        { key: 'dimensions',    label: 'Dimensions' },
        { key: 'hazmat',        label: 'HazMat', type: 'select', options: ['true','false'] },
        { key: 'status',        label: 'Status', type: 'select', options: ['active','restricted','retired'] },
        { key: 'notes',         label: 'Notes',  type: 'textarea' },
      ]}
    />
  );
}
