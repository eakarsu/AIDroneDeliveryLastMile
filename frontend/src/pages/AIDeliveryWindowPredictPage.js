import React from 'react';
import AIPage from '../components/AIPage';
import { aiDeliveryWindowPredict } from '../services/api';

export default function AIDeliveryWindowPredictPage() {
  return (
    <AIPage
      title="AI · Delivery Window Predictor"
      feature="delivery-window-predict"
      subtitle="Probabilistic on-time arrival forecast across pending missions."
      inputs={[
        { key: 'notes', label: 'Constraints / Bias Notes', type: 'textarea' },
      ]}
      run={(v) => aiDeliveryWindowPredict(v)}
    />
  );
}
