import React from 'react';
import AIPage from '../components/AIPage';
import { aiVendorQualityScore } from '../services/api';

export default function AIVendorQualityScorePage() {
  return (
    <AIPage
      title="AI · Vendor Quality Score"
      feature="vendor-quality-score"
      subtitle="Score a drone / hardware vendor on quality, on-time delivery and safety."
      inputs={[
        { key: 'vendor',         label: 'Vendor Name' },
        { key: 'metrics_notes',  label: 'Metrics / Notes', type: 'textarea' },
      ]}
      run={(v) => aiVendorQualityScore(v)}
    />
  );
}
