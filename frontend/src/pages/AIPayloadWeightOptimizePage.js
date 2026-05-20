import React from 'react';
import AIPage from '../components/AIPage';
import { aiPayloadWeightOptimize } from '../services/api';

function parseJson(v) { try { return JSON.parse(v); } catch (_) { return undefined; } }

export default function AIPayloadWeightOptimizePage() {
  return (
    <AIPage
      title="AI · Payload Weight Optimize"
      feature="payload-weight-optimize"
      subtitle="Assign packages to drones to maximize on-time delivery within MTOW."
      inputs={[
        { key: 'payloads_json', label: 'Payloads (JSON array)', type: 'textarea' },
        { key: 'drone_spec',    label: 'Drone Spec Context',    type: 'textarea' },
      ]}
      run={(v) => aiPayloadWeightOptimize({
        payloads: parseJson(v.payloads_json),
        drone_spec: v.drone_spec,
      })}
    />
  );
}
