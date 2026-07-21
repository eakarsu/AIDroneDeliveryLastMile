'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { validateMission, validateSafetySnapshot, assertMissionChecks, assertTransition } = require('../domain/missionWorkflow');

const mission = validateMission({ external_ref: 'm-1', drone_ref: 'd-1', payload_kg: 2, max_payload_kg: 3, planned_energy_wh: 100, reserve_energy_wh: 20, route: [{ lat: 1, lon: 2, altitude_m: 40 }, { lat: 2, lon: 3, altitude_m: 45 }] });
test('valid safety evidence passes deterministic checks', () => {
  const snapshot = validateSafetySnapshot({ source: 'recorded-adapter', observed_at: '2030-01-01T00:00:00Z', expires_at: '2030-01-01T01:00:00Z', geofence_status: 'clear', weather_status: 'acceptable', airspace_status: 'authorized', remote_id_ready: true, communications_ready: true, available_energy_wh: 140 });
  assert.doesNotThrow(() => assertMissionChecks(mission, snapshot, new Date('2030-01-01T00:30:00Z')));
});
test('energy reserve and expiry are enforced', () => {
  const snapshot = validateSafetySnapshot({ source: 'recorded-adapter', observed_at: '2030-01-01T00:00:00Z', expires_at: '2030-01-01T01:00:00Z', geofence_status: 'clear', weather_status: 'clear', airspace_status: 'authorized', remote_id_ready: true, communications_ready: true, available_energy_wh: 110 });
  assert.throws(() => assertMissionChecks(mission, snapshot, new Date('2030-01-01T00:30:00Z')), /energy/);
});
test('approval is admin-only', () => {
  assert.throws(() => assertTransition('awaiting_approval', 'approved', 'pilot'), /admin/);
  assert.doesNotThrow(() => assertTransition('awaiting_approval', 'approved', 'admin'));
});
