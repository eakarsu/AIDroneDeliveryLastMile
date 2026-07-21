'use strict';

const STATES = Object.freeze([
  'draft', 'validated', 'awaiting_approval', 'approved', 'released',
  'monitoring', 'contingency', 'completed', 'aborted', 'failed',
]);

const TRANSITIONS = Object.freeze({
  draft: ['validated', 'failed'],
  validated: ['awaiting_approval', 'draft', 'failed'],
  awaiting_approval: ['approved', 'draft', 'failed'],
  approved: ['released', 'aborted', 'failed'],
  released: ['monitoring', 'contingency', 'aborted', 'failed'],
  monitoring: ['contingency', 'completed', 'aborted', 'failed'],
  contingency: ['monitoring', 'completed', 'aborted', 'failed'],
  failed: ['draft', 'aborted'],
  completed: [], aborted: [],
});

function text(value, name, max = 500) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max) throw new Error(`${name} is invalid`);
  return value.trim();
}

function finite(value, name, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < min || number > max) throw new Error(`${name} is invalid`);
  return number;
}

function validateMission(input) {
  if (!input || typeof input !== 'object') throw new Error('mission is required');
  if (!Array.isArray(input.route) || input.route.length < 2 || input.route.length > 200) throw new Error('route must contain 2-200 points');
  const route = input.route.map((point) => ({
    lat: finite(point?.lat, 'route latitude', -90, 90),
    lon: finite(point?.lon, 'route longitude', -180, 180),
    altitude_m: finite(point?.altitude_m, 'route altitude', 0, 500),
  }));
  return {
    external_ref: text(input.external_ref, 'external_ref', 200),
    drone_ref: text(input.drone_ref, 'drone_ref', 200),
    payload_kg: finite(input.payload_kg, 'payload_kg', 0, 500),
    max_payload_kg: finite(input.max_payload_kg, 'max_payload_kg', 0.01, 500),
    planned_energy_wh: finite(input.planned_energy_wh, 'planned_energy_wh', 0.01, 100000),
    reserve_energy_wh: finite(input.reserve_energy_wh, 'reserve_energy_wh', 0, 100000),
    route,
  };
}

function validateSafetySnapshot(input) {
  if (!input || typeof input !== 'object') throw new Error('safety_snapshot is required');
  const observedAt = new Date(input.observed_at);
  const expiresAt = new Date(input.expires_at);
  if (!Number.isFinite(observedAt.getTime()) || !Number.isFinite(expiresAt.getTime()) || expiresAt <= observedAt) {
    throw new Error('safety snapshot timestamps are invalid');
  }
  const snapshot = {
    source: text(input.source, 'source', 200),
    observed_at: observedAt.toISOString(),
    expires_at: expiresAt.toISOString(),
    geofence_status: String(input.geofence_status || '').toLowerCase(),
    weather_status: String(input.weather_status || '').toLowerCase(),
    airspace_status: String(input.airspace_status || '').toLowerCase(),
    remote_id_ready: input.remote_id_ready === true,
    communications_ready: input.communications_ready === true,
    available_energy_wh: finite(input.available_energy_wh, 'available_energy_wh', 0, 100000),
  };
  if (snapshot.geofence_status !== 'clear') throw new Error('geofence status is not clear');
  if (!['acceptable', 'clear'].includes(snapshot.weather_status)) throw new Error('weather status is not acceptable');
  if (snapshot.airspace_status !== 'authorized') throw new Error('airspace is not recorded as authorized');
  if (!snapshot.remote_id_ready || !snapshot.communications_ready) throw new Error('Remote ID and communications readiness are required');
  return snapshot;
}

function assertMissionChecks(mission, snapshot, now = new Date()) {
  if (mission.payload_kg > mission.max_payload_kg) throw new Error('payload exceeds recorded mission limit');
  if (snapshot.available_energy_wh < mission.planned_energy_wh + mission.reserve_energy_wh) throw new Error('recorded energy does not meet plan plus reserve');
  if (new Date(snapshot.expires_at) <= now) throw new Error('safety snapshot has expired');
}

function assertTransition(from, to, role) {
  if (!STATES.includes(from) || !STATES.includes(to) || !(TRANSITIONS[from] || []).includes(to)) {
    throw new Error(`Transition ${from} -> ${to} is not allowed`);
  }
  if (!['pilot', 'admin'].includes(role)) throw new Error('Role cannot change mission state');
  if (to === 'approved' && role !== 'admin') throw new Error('Only admin may approve a mission');
}

module.exports = { STATES, TRANSITIONS, validateMission, validateSafetySnapshot, assertMissionChecks, assertTransition };
