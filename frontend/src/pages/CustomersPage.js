import React from 'react';
import CrudPage from '../components/CrudPage';
import { customersApi } from '../services/api';

export default function CustomersPage() {
  return (
    <CrudPage
      title="Customers"
      subtitle="Healthcare, retail, pharmacy and logistics partners."
      api={customersApi}
      statusKey="status"
      fields={[
        { key: 'customer_id', label: 'Customer ID' },
        { key: 'name',        label: 'Name' },
        { key: 'contact',     label: 'Contact' },
        { key: 'type',        label: 'Type',  type: 'select', options: ['healthcare','retail','pharmacy','food_retail','logistics'] },
        { key: 'region',      label: 'Region' },
        { key: 'status',      label: 'Status', type: 'select', options: ['active','paused','blocked'] },
        { key: 'notes',       label: 'Notes',  type: 'textarea' },
      ]}
    />
  );
}
