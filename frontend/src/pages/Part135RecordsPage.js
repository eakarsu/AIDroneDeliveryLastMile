import React from 'react';
import CrudPage from '../components/CrudPage';
import { part135RecordsApi } from '../services/api';

export default function Part135RecordsPage() {
  return (
    <CrudPage
      title="Part 135 Records Ledger"
      subtitle="FAA Part 135 consolidated audit trail — pilot duty time, aircraft airworthiness, training, medical, checkrides."
      api={part135RecordsApi}
      statusKey="status"
      fields={[
        { key: 'record_id',    label: 'Record ID' },
        { key: 'record_type',  label: 'Type',     type: 'select', options: ['duty_time','airworthiness','training','medical','checkride'] },
        { key: 'subject_type', label: 'Subject',  type: 'select', options: ['pilot','drone','observer'] },
        { key: 'subject_id',   label: 'Subject ID' },
        { key: 'period_start', label: 'Period Start', type: 'datetime-local' },
        { key: 'period_end',   label: 'Period End',   type: 'datetime-local' },
        { key: 'hours_logged', label: 'Hours Logged', type: 'number' },
        { key: 'status',       label: 'Status',   type: 'select', options: ['open','closed','overdue','exempt'] },
        { key: 'authority',    label: 'Authority',type: 'select', options: ['FAA','RCAA','IAA','CAAS','EASA','GCAA'] },
        { key: 'reference',    label: 'Reference' },
        { key: 'evidence_url', label: 'Evidence URL' },
        { key: 'notes',        label: 'Notes',    type: 'textarea' },
      ]}
    />
  );
}
