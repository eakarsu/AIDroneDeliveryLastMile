const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const ai = require('../services/ai');

async function record(feature, input, output) {
  try {
    await pool.query(
      'INSERT INTO ai_results (feature, input, output) VALUES ($1, $2, $3)',
      [feature, input || {}, output || {}]
    );
  } catch (e) {
    console.warn(`[ai] failed to record ${feature}:`, e.message);
  }
}

// ──────────────────────────────────────────────────────────────
// 5 sample fills per verb
// ──────────────────────────────────────────────────────────────
const SAMPLES = {
  'route-corridor-plan': [
    { label: 'Charlotte hospital BVLOS', values: { origin: 'Mercy Hospital, Charlotte NC', destination: '4521 Oak Ridge, Charlotte NC', context_notes: 'Mile-2 medical corridor, Zipline P2, low-density residential overflight, ATC coordination with KCLT.' } },
    { label: 'Frisco TX retail corridor',  values: { origin: 'Walmart Store #1804, Dallas TX', destination: '8919 Whisper Way, Dallas TX', context_notes: 'Wing Mk2, 2.4 kg payload, BVLOS waiver active 7-15 LT, suburban overflight.' } },
    { label: 'Kigali RW medical',          values: { origin: 'Kigali Vertiport (Zipline)', destination: 'Muhanga District Hospital, RW', context_notes: 'Zipline P1, blood + vaccine cargo, mountainous terrain, RCAA medical-cargo authorization.' } },
    { label: 'Singapore hospital',         values: { origin: 'Skyports Hub, Loyang', destination: 'Singapore General Hospital', context_notes: 'Skyports CarrierBot, lab samples, CTR transit requires CAAS pre-coordination.' } },
    { label: 'Dublin food corridor',       values: { origin: 'Manna Hub, Lusk IE', destination: 'St Vincent Hospital, Dublin IE', context_notes: 'Manna Mavericks Mk3, hot food + meds, EIDW CTR pre-coordination, suburban overflight.' } },
  ],

  'weather-flight-window': [
    { label: 'Charlotte NC — Zipline P2',  values: { location: 'Charlotte NC', profile_notes: 'Zipline P2 Zip, 2 kg payload, MTOW 2.5 kg, wind tolerance 12 kt.' } },
    { label: 'Frederick CO — Wing Mk2',    values: { location: 'Frederick CO',  profile_notes: 'Wing Mk2, 1.1 kg payload, wind tolerance 15 kt, ceiling minimum 1500 ft AGL.' } },
    { label: 'Kigali RW — Zipline P1',     values: { location: 'Muhanga RW',    profile_notes: 'Zipline P1, 1.5 kg medical cargo, mountain corridor, wind tolerance 18 kt.' } },
    { label: 'Singapore — Skyports',       values: { location: 'Singapore',     profile_notes: 'Skyports CarrierBot, 2 kg samples, urban CTR, wind tolerance 14 kt.' } },
    { label: 'Dublin IE — Manna',          values: { location: 'Dublin IE',     profile_notes: 'Manna Mavericks Mk3, 0.9 kg payload, wind tolerance 20 kt, IFR-tolerant.' } },
  ],

  'mission-brief': [
    { label: 'MSN-2026-0001 medical',   values: { mission_id: 'MSN-2026-0001', context_notes: 'Charlotte NC, blood product, Zipline P2, pilot Maya Reynolds.' } },
    { label: 'MSN-2026-0002 retail',    values: { mission_id: 'MSN-2026-0002', context_notes: 'Dallas TX, retail grocery, Wing Mk2, pilot Daniel Ortiz.' } },
    { label: 'MSN-2026-0003 RW medical',values: { mission_id: 'MSN-2026-0003', context_notes: 'Muhanga RW, medical supply, Zipline P1, pilot Aline Uwase.' } },
    { label: 'MSN-2026-0007 retail',    values: { mission_id: 'MSN-2026-0007', context_notes: 'Logan UT, retail grocery, Wing Mk2, pilot Emma Caldwell.' } },
    { label: 'MSN-2026-0009 GH blood',  values: { mission_id: 'MSN-2026-0009', context_notes: 'Akropong GH, blood product, Zipline P1, pilot Kwame Asante.' } },
  ],

  'anomaly-triage': [
    { label: 'C2 link dropout 12s',          values: { telemetry_notes: 'FLT-2026-0003 C2 link dropout 12s over Muhanga corridor, battery 78%, RTH armed, GPS nominal.' } },
    { label: 'GPS loss + low battery',       values: { telemetry_notes: 'FLT-2026-0012 GPS lock lost at 14:42Z, battery 22%, IMU dead-reckoning active 4 min.' } },
    { label: 'Wind gust 28 kt',              values: { telemetry_notes: 'FLT-2026-0002 wind gust 28 kt observed mid-corridor, attitude excursion +15° pitch, payload secure.' } },
    { label: 'Bird strike — minor',          values: { telemetry_notes: 'FLT-2026-0001 bird strike audio event 4 nm out, vibration nominal post-event, motor RPM stable.' } },
    { label: 'Payload release fail',         values: { telemetry_notes: 'FLT-2026-0010 winch jam at destination, package not released, hover at 30 ft AGL, battery 41%.' } },
  ],

  'executive-brief': [
    { label: 'Default snapshot',                 values: { notes: '' } },
    { label: 'Bias toward US ops',                values: { notes: 'Bias toward US Part 135 ops (Charlotte / Dallas / Logan / Bentonville).' } },
    { label: 'Bias toward Africa medical',        values: { notes: 'Focus on Rwanda + Ghana medical corridors and Zipline ops.' } },
    { label: 'Bias toward EU food / retail',      values: { notes: 'Focus on Manna IE and DHL DE operations + customer comms.' } },
    { label: 'Bias toward incidents / safety',    values: { notes: 'Focus on open incidents, parachute SBs, and corrective actions.' } },
  ],

  'payload-weight-optimize': [
    {
      label: 'Mixed retail batch — Dallas',
      values: {
        payloads_json: JSON.stringify([
          { package_id: 'PKG-2026-0002', weight_kg: 2.4, type: 'retail_grocery' },
          { package_id: 'PKG-2026-0014', weight_kg: 2.8, type: 'retail_grocery' },
          { package_id: 'PKG-2026-0010', weight_kg: 1.2, type: 'food_grocery' },
        ], null, 2),
        drone_spec: 'Wing Mk2 MTOW 2.5 kg, Flytrex Aviator 3 MTOW 3.0 kg.',
      },
    },
    {
      label: 'Medical batch — Charlotte NC',
      values: {
        payloads_json: JSON.stringify([
          { package_id: 'PKG-2026-0001', weight_kg: 1.25, type: 'blood_product' },
          { package_id: 'PKG-2026-0011', weight_kg: 0.6,  type: 'pharmacy_rx' },
        ], null, 2),
        drone_spec: 'Zipline P2 MTOW 2.5 kg, cold-chain pod available.',
      },
    },
    {
      label: 'Rwanda medical batch',
      values: {
        payloads_json: JSON.stringify([
          { package_id: 'PKG-2026-0003', weight_kg: 3.8, type: 'medical_supply' },
          { package_id: 'PKG-2026-0009', weight_kg: 1.5, type: 'blood_product' },
        ], null, 2),
        drone_spec: 'Zipline P1 MTOW 4.0 kg.',
      },
    },
    {
      label: 'Singapore lab samples',
      values: {
        payloads_json: JSON.stringify([
          { package_id: 'PKG-2026-0008', weight_kg: 2.0, type: 'medical_sample' },
          { package_id: 'PKG-2026-0015', weight_kg: 1.9, type: 'medical_sample' },
        ], null, 2),
        drone_spec: 'Skyports CarrierBot MTOW 4.0 kg, cold-chain only.',
      },
    },
    {
      label: 'Logan UT pharmacy run',
      values: {
        payloads_json: JSON.stringify([
          { package_id: 'PKG-2026-0004', weight_kg: 0.45, type: 'pharmacy_rx' },
          { package_id: 'PKG-2026-0013', weight_kg: 0.30, type: 'pharmacy_rx' },
          { package_id: 'PKG-2026-0007', weight_kg: 1.10, type: 'retail_grocery' },
        ], null, 2),
        drone_spec: 'Wing Hummingbird MTOW 1.4 kg.',
      },
    },
  ],

  'battery-cycle-prognostic': [
    { label: 'Analyze current battery fleet', values: {} },
    { label: 'Analyze current battery fleet', values: {} },
    { label: 'Analyze current battery fleet', values: {} },
    { label: 'Analyze current battery fleet', values: {} },
    { label: 'Analyze current battery fleet', values: {} },
  ],

  'regulatory-checklist': [
    { label: 'FAA Part 135 + 44807 BVLOS', values: { mission_id: 'MSN-2026-0001', authority: 'FAA' } },
    { label: 'RCAA medical cargo',         values: { mission_id: 'MSN-2026-0003', authority: 'RCAA' } },
    { label: 'IAA Specific Cat',           values: { mission_id: 'MSN-2026-0006', authority: 'IAA' } },
    { label: 'CAAS UA Operator',           values: { mission_id: 'MSN-2026-0008', authority: 'CAAS' } },
    { label: 'GCAA medical UAS',           values: { mission_id: 'MSN-2026-0009', authority: 'GCAA' } },
  ],

  'pilot-shift-schedule': [
    { label: '7-day default',                  values: { constraints_notes: 'All US hubs, BVLOS waiver pilots only, max 5 hr stick time/day, 12 hr rest.' } },
    { label: 'Charlotte hub only',             values: { constraints_notes: 'Charlotte Hub only, two BVLOS pilots, AM + PM coverage 06-22 LT.' } },
    { label: 'Multi-hub, surge week',          values: { constraints_notes: 'Surge week across Dallas + Bentonville + Granbury, expect +25% demand.' } },
    { label: 'Rwanda + Ghana medical',         values: { constraints_notes: 'Kigali + Akropong medical corridor, 24/7 coverage, 4 pilots, blackout 22-04 LT requires shift handoff.' } },
    { label: 'EU ops 6-22 LT',                 values: { constraints_notes: 'Dublin + Frankfurt hubs, EASA rest rules, 6-22 LT only, 3 pilots.' } },
  ],

  'ground-observer-plan': [
    { label: 'Charlotte Mile-2 med corridor', values: { corridor_notes: 'Charlotte Mile-2 Med Corridor, 1.8 km, suburban, ATC coordination with KCLT.' } },
    { label: 'Dallas Frisco retail corridor', values: { corridor_notes: 'Dallas Frisco Retail Corridor, 3.2 km, suburban, BVLOS waiver active 7-15 LT.' } },
    { label: 'Muhanga hospital corridor',     values: { corridor_notes: 'Muhanga Hospital Corridor, 22 km, rural mountain, RCAA medical-cargo, line-of-sight degraded.' } },
    { label: 'Singapore CTR corridor',        values: { corridor_notes: 'Loyang to Singapore General Hospital, 8 km, urban CTR, CAAS deconfliction.' } },
    { label: 'Dublin food corridor',          values: { corridor_notes: 'Manna Lusk to St Vincent Hospital, 12 km, suburban + coastal, EIDW pre-coordination.' } },
  ],

  'conflict-airspace-detect': [
    {
      label: 'Charlotte med corridor',
      values: {
        route_notes: 'Mercy Hospital → 4521 Oak Ridge, 1.8 km, FL000-FL004 (0-400 ft AGL), KCLT Mode-C veil intersect.',
        zones_json: JSON.stringify([
          { zone_id: 'ASZ-001', name: 'KCLT Mode-C Veil', classification: 'Class B' },
          { zone_id: 'ASZ-015', name: 'KRDU Class C',     classification: 'Class C' },
        ], null, 2),
      },
    },
    {
      label: 'Frisco retail corridor',
      values: {
        route_notes: 'Walmart #1804 → Whisper Way, 3.2 km, sub-400 ft AGL, KDAL surface area.',
        zones_json: JSON.stringify([
          { zone_id: 'ASZ-002', name: 'KDAL surface area', classification: 'Class B' },
        ], null, 2),
      },
    },
    {
      label: 'Muhanga med corridor',
      values: {
        route_notes: 'Kigali Vertiport → Muhanga District Hospital, 22 km, FL000-FL015, transits HKIA TMA.',
        zones_json: JSON.stringify([
          { zone_id: 'ASZ-003', name: 'Kigali HKIA TMA', classification: 'Class C' },
        ], null, 2),
      },
    },
    {
      label: 'Phoenix Reserve corridor (TFR)',
      values: {
        route_notes: 'Phoenix Reserve Hub → Glendale sector, 4 km, sub-400 ft AGL.',
        zones_json: JSON.stringify([
          { zone_id: 'ASZ-011', name: 'Phoenix TFR (wildfire)', classification: 'TFR' },
        ], null, 2),
      },
    },
    {
      label: 'Frankfurt parcel corridor',
      values: {
        route_notes: 'Frankfurt DHL Hub → Bad Homburg, 14 km, FL000-FL015, transits EDDF CTR.',
        zones_json: JSON.stringify([
          { zone_id: 'ASZ-013', name: 'EDDF CTR', classification: 'Class C' },
        ], null, 2),
      },
    },
  ],

  'customer-comms-draft': [
    { label: 'Delivery complete — retail',    values: { event_type: 'delivery_complete', mission_id: 'MSN-2026-0014', extra_notes: 'Walmart customer, package landed at 4412 Whisper Way Dallas TX.' } },
    { label: 'Delay due to weather',          values: { event_type: 'weather_delay',     mission_id: 'MSN-2026-0010', extra_notes: 'Granbury TX, wind 22 kt above tolerance, ETA shifted 90 min.' } },
    { label: 'Mission abort + reroute',       values: { event_type: 'mission_aborted',   mission_id: 'MSN-2026-0012', extra_notes: 'Rwanda medical run aborted mid-flight, package returned to Kigali Vertiport.' } },
    { label: 'Drone on-the-way',              values: { event_type: 'drone_dispatched',  mission_id: 'MSN-2026-0002', extra_notes: 'Dallas grocery customer, ETA 8 min, observer in position.' } },
    { label: 'Hospital priority lift confirm',values: { event_type: 'priority_confirmed',mission_id: 'MSN-2026-0001', extra_notes: 'Mercy Hospital blood product, ETA 12 min, Code-Red protocol.' } },
  ],

  'vertiport-capacity-plan': [
    { label: 'VPT-001 Charlotte',     values: { vertiport_id: 'VPT-001', demand_notes: '4 pads, peak 14 arrivals/hr forecast 10-12 LT.' } },
    { label: 'VPT-003 Muhanga (busy)',values: { vertiport_id: 'VPT-003', demand_notes: '6 pads, peak 24 arrivals/hr, surge planned for vaccine campaign.' } },
    { label: 'VPT-007 Singapore',     values: { vertiport_id: 'VPT-007', demand_notes: '5 pads, peak 18 arrivals/hr, CTR coordination throttles inbound.' } },
    { label: 'VPT-013 Frankfurt',     values: { vertiport_id: 'VPT-013', demand_notes: '5 pads, parcel surge 22 arrivals/hr during 14-17 LT.' } },
    { label: 'VPT-002 Frisco TX',     values: { vertiport_id: 'VPT-002', demand_notes: '3 pads, peak 16 arrivals/hr, retail surge weekends.' } },
  ],

  'contingency-landing-plan': [
    { label: 'Charlotte Mile-2 corridor', values: { route_notes: 'Mercy Hospital → 4521 Oak Ridge, 1.8 km, suburban.', drone_spec: 'Zipline P2, parachute equipped, MTOW 2.5 kg.' } },
    { label: 'Muhanga corridor (mountain)',values: { route_notes: 'Kigali Vertiport → Muhanga District Hospital, 22 km, rural mountain.', drone_spec: 'Zipline P1, parachute equipped, MTOW 4 kg.' } },
    { label: 'Singapore CTR corridor',    values: { route_notes: 'Skyports Hub → Singapore General Hospital, 8 km, dense urban.', drone_spec: 'Skyports CarrierBot, parachute + low-altitude land.' } },
    { label: 'Frankfurt parcel corridor', values: { route_notes: 'Frankfurt DHL Hub → Bad Homburg, 14 km, suburban + industrial.', drone_spec: 'Volansi VOLY M20, parachute equipped, MTOW 9 kg.' } },
    { label: 'Frederick CO corridor',     values: { route_notes: 'Wing Frederick Hub → Frederick Field House, 4 km, suburban.', drone_spec: 'Wing Mk2, no parachute, MTOW 1.4 kg.' } },
  ],

  'incident-post-mortem': [
    { label: 'INC-2026-0008 parachute misfire', values: { incident_id: 'INC-2026-0008', notes: 'Parachute misfire on FLT-2026-0011 at landing approach; pyrotechnic squib did not deploy, drone landed hard, no injuries.' } },
    { label: 'INC-2026-0003 C2 dropout',         values: { incident_id: 'INC-2026-0003', notes: 'C2 link dropout 12s on FLT-2026-0003 over Muhanga corridor. RTH armed but recovered link before action.' } },
    { label: 'INC-2026-0010 TFR conflict',       values: { incident_id: 'INC-2026-0010', notes: 'TFR (wildfire) appeared mid-flight over Singapore CTR; flight rerouted, no penetration of TFR.' } },
    { label: 'INC-2026-0011 payload release',    values: { incident_id: 'INC-2026-0011', notes: 'Winch jam on FLT-2026-0010 at destination Granbury TX; drone hovered 4 min then RTH with payload.' } },
    { label: 'INC-2026-0007 airspace intrusion', values: { incident_id: 'INC-2026-0007', notes: 'Unauthorized GA aircraft transited Mile-2 corridor; drone took avoidance action, recovered nominal.' } },
  ],

  'vendor-quality-score': [
    { label: 'Zipline (Rwanda + Ghana)',     values: { vendor: 'Zipline International', metrics_notes: 'On-time delivery 96%, no incidents in 12 months, regulatory record strong.' } },
    { label: 'Wing (Alphabet)',              values: { vendor: 'Wing LLC',               metrics_notes: 'On-time 93%, 2 low-severity incidents, support response 4 hr median.' } },
    { label: 'Matternet (Hayward)',          values: { vendor: 'Matternet Inc.',         metrics_notes: 'On-time 89%, 1 medium incident (winch), strong cold-chain hardware.' } },
    { label: 'Volansi (deep-rural)',         values: { vendor: 'Volansi Inc.',           metrics_notes: 'On-time 91%, MTOW 9 kg, fewer pilots qualified, support response 8 hr.' } },
    { label: 'Manna Aero (Dublin)',          values: { vendor: 'Manna Aero',             metrics_notes: 'On-time 94% in food cat, EASA Specific Cat compliant, no hazmat capability.' } },
  ],

  // ─── Apply pass 7 samples ────────────────────────────────────────────
  'customer-eta-narrate': [
    { label: 'MSN-2026-0001 Mercy blood, cruise',  values: { mission_id: 'MSN-2026-0001', phase: 'cruise',   distance_remaining_km: 1.2, wind_kt: 8,  notes: 'Code-Red blood product, Mercy Hospital, on schedule.' } },
    { label: 'MSN-2026-0010 weather delay',         values: { mission_id: 'MSN-2026-0010', phase: 'preflight',distance_remaining_km: 0,   wind_kt: 22, notes: 'Granbury TX wind above tolerance, delay 90 min.' } },
    { label: 'MSN-2026-0014 Dallas approach',       values: { mission_id: 'MSN-2026-0014', phase: 'approach', distance_remaining_km: 0.4, wind_kt: 6,  notes: 'Walmart grocery customer, observer in position.' } },
    { label: 'MSN-2026-0003 Muhanga climb',         values: { mission_id: 'MSN-2026-0003', phase: 'climb',    distance_remaining_km: 22,  wind_kt: 11, notes: 'Medical supply, RCAA priority lane.' } },
    { label: 'MSN-2026-0012 abort + RTH',           values: { mission_id: 'MSN-2026-0012', phase: 'aborted',  distance_remaining_km: 0,   wind_kt: 5,  notes: 'Aborted mid-flight, returning to Kigali Vertiport.' } },
  ],

  'weight-balance-advise': [
    {
      label: 'Wing Mk2 — 3 packages',
      values: {
        payloads_json: JSON.stringify([
          { package_id: 'PKG-2026-0002', weight_kg: 0.9, bay_preference: 'forward' },
          { package_id: 'PKG-2026-0014', weight_kg: 0.6, bay_preference: 'center' },
          { package_id: 'PKG-2026-0010', weight_kg: 0.3, bay_preference: 'aft' },
        ], null, 2),
        drone_spec: 'Wing Mk2 MTOW 2.5 kg, single-bay tandem, CG window ±4 cm from datum.',
      },
    },
    {
      label: 'Zipline P2 — blood + Rx',
      values: {
        payloads_json: JSON.stringify([
          { package_id: 'PKG-2026-0001', weight_kg: 1.25, bay_preference: 'forward' },
          { package_id: 'PKG-2026-0011', weight_kg: 0.6,  bay_preference: 'aft' },
        ], null, 2),
        drone_spec: 'Zipline P2 MTOW 2.5 kg, fixed-wing, CG ±3 cm.',
      },
    },
    {
      label: 'Zipline P1 — heavy medical',
      values: {
        payloads_json: JSON.stringify([
          { package_id: 'PKG-2026-0003', weight_kg: 3.8, bay_preference: 'center' },
          { package_id: 'PKG-2026-0009', weight_kg: 1.5, bay_preference: 'forward' },
        ], null, 2),
        drone_spec: 'Zipline P1 MTOW 4.0 kg, CG window ±5 cm.',
      },
    },
    {
      label: 'Skyports CarrierBot — lab',
      values: {
        payloads_json: JSON.stringify([
          { package_id: 'PKG-2026-0008', weight_kg: 2.0, bay_preference: 'center' },
          { package_id: 'PKG-2026-0015', weight_kg: 1.9, bay_preference: 'center' },
        ], null, 2),
        drone_spec: 'Skyports CarrierBot MTOW 4.0 kg, cold-chain pod, CG ±4 cm.',
      },
    },
    {
      label: 'Wing Hummingbird — Logan',
      values: {
        payloads_json: JSON.stringify([
          { package_id: 'PKG-2026-0004', weight_kg: 0.45, bay_preference: 'forward' },
          { package_id: 'PKG-2026-0013', weight_kg: 0.30, bay_preference: 'aft' },
          { package_id: 'PKG-2026-0007', weight_kg: 1.10, bay_preference: 'center' },
        ], null, 2),
        drone_spec: 'Wing Hummingbird MTOW 1.4 kg, CG ±2 cm.',
      },
    },
  ],

  'delivery-window-predict': [
    { label: 'All pending missions',          values: { notes: '' } },
    { label: 'US ops bias',                   values: { notes: 'Bias toward US Part 135 missions (Charlotte / Dallas / Logan / Bentonville).' } },
    { label: 'Rwanda + Ghana medical',        values: { notes: 'Focus on Rwanda + Ghana medical corridors only.' } },
    { label: 'EU food + retail',              values: { notes: 'Focus on Manna IE + DHL DE retail / food missions.' } },
    { label: 'Surge week',                    values: { notes: 'Assume +25% demand surge across all hubs this week.' } },
  ],

  'notam-aware-reroute': [
    {
      label: 'Charlotte med corridor + KCLT TFR',
      values: {
        route_notes: 'Mercy Hospital → 4521 Oak Ridge, 1.8 km, FL000-FL004 (0-400 ft AGL).',
        notams_json: JSON.stringify([
          { notam_id: 'A1234/26', summary: 'KCLT VIP TFR sfc-3000 1400-1700Z', severity: 'high' },
        ], null, 2),
        drone_spec: 'Zipline P2 MTOW 2.5 kg, parachute equipped.',
      },
    },
    {
      label: 'Phoenix corridor + wildfire TFR',
      values: {
        route_notes: 'Phoenix Reserve Hub → Glendale sector, 4 km, sub-400 ft AGL.',
        notams_json: JSON.stringify([
          { notam_id: 'A8876/26', summary: 'Wildfire TFR sfc-8000, 30 nm radius KIWA', severity: 'high' },
        ], null, 2),
        drone_spec: 'Matternet M2 MTOW 2 kg.',
      },
    },
    {
      label: 'Singapore CTR + airshow NOTAM',
      values: {
        route_notes: 'Skyports Hub → Singapore General Hospital, 8 km, dense urban.',
        notams_json: JSON.stringify([
          { notam_id: 'C0312/26', summary: 'CAAS airshow box, Marina Bay, 0800-1000Z', severity: 'medium' },
        ], null, 2),
        drone_spec: 'Skyports CarrierBot MTOW 4 kg.',
      },
    },
    {
      label: 'Frankfurt + EDDF SID change',
      values: {
        route_notes: 'Frankfurt DHL Hub → Bad Homburg, 14 km, FL000-FL015.',
        notams_json: JSON.stringify([
          { notam_id: 'D2218/26', summary: 'EDDF SID 26L revised, helo lane closed', severity: 'medium' },
        ], null, 2),
        drone_spec: 'Volansi VOLY M20 MTOW 9 kg.',
      },
    },
    {
      label: 'Muhanga + RW closure',
      values: {
        route_notes: 'Kigali Vertiport → Muhanga District Hospital, 22 km, mountain.',
        notams_json: JSON.stringify([
          { notam_id: 'R0091/26', summary: 'Live-fire range active 1200-1500Z near corridor', severity: 'high' },
        ], null, 2),
        drone_spec: 'Zipline P1 MTOW 4 kg.',
      },
    },
  ],
};

// GET /api/ai/samples?feature=<verb>
router.get('/samples', (req, res) => {
  try {
    const feature = (req.query.feature || '').toString();
    if (!feature) return res.json({ features: Object.keys(SAMPLES) });
    const samples = SAMPLES[feature];
    if (!samples) return res.status(404).json({ error: `unknown feature: ${feature}` });
    res.json({ feature, samples });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/ai/history?feature=<name>&limit=<n>
router.get('/history', async (req, res) => {
  try {
    const feature = (req.query.feature || '').toString();
    const limit = Math.min(parseInt(req.query.limit, 10) || 25, 200);
    let r;
    if (feature) {
      r = await pool.query(
        'SELECT id, feature, input, output, created_at FROM ai_results WHERE feature = $1 ORDER BY created_at DESC LIMIT $2',
        [feature, limit]
      );
    } else {
      r = await pool.query(
        'SELECT id, feature, input, output, created_at FROM ai_results ORDER BY created_at DESC LIMIT $1',
        [limit]
      );
    }
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 1. POST /api/ai/route-corridor-plan
router.post('/route-corridor-plan', async (req, res) => {
  try {
    const { origin = '', destination = '', context_notes = '' } = req.body || {};
    const result = await ai.routeCorridorPlan(origin || 'unspecified origin', destination || 'unspecified destination', { notes: context_notes });
    await record('route-corridor-plan', { origin, destination, context_notes }, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 2. POST /api/ai/weather-flight-window
router.post('/weather-flight-window', async (req, res) => {
  try {
    const { location = '', profile_notes = '' } = req.body || {};
    const result = await ai.weatherFlightWindow(location || 'unspecified location', { notes: profile_notes });
    await record('weather-flight-window', { location, profile_notes }, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 3. POST /api/ai/mission-brief
router.post('/mission-brief', async (req, res) => {
  try {
    const { mission_id = '', context_notes = '' } = req.body || {};
    let ctx = { notes: context_notes };
    if (mission_id) {
      try {
        const r = await pool.query('SELECT * FROM missions WHERE mission_id = $1 LIMIT 1', [mission_id]);
        if (r.rows.length) ctx.mission = r.rows[0];
      } catch (_) {}
    }
    const result = await ai.missionBrief(mission_id || 'unspecified', ctx);
    await record('mission-brief', { mission_id, context_notes }, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 4. POST /api/ai/anomaly-triage
router.post('/anomaly-triage', async (req, res) => {
  try {
    const { telemetry_notes = '', telemetry = {} } = req.body || {};
    const result = await ai.anomalyTriage(Object.keys(telemetry).length ? telemetry : { notes: telemetry_notes });
    await record('anomaly-triage', { telemetry_notes }, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 5. POST /api/ai/executive-brief
router.post('/executive-brief', async (req, res) => {
  try {
    const [drones, flights, missions, incidents] = await Promise.all([
      pool.query("SELECT COUNT(*) FILTER (WHERE status='ready') AS ready, COUNT(*) FILTER (WHERE status='in_flight') AS in_flight, COUNT(*) FILTER (WHERE status='maintenance') AS maintenance, COUNT(*) AS total FROM drones"),
      pool.query("SELECT COUNT(*) FILTER (WHERE status='scheduled') AS scheduled, COUNT(*) FILTER (WHERE status='completed') AS completed, COUNT(*) FILTER (WHERE status='aborted') AS aborted FROM flights"),
      pool.query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status='in_flight') AS in_flight FROM missions"),
      pool.query("SELECT COUNT(*) FILTER (WHERE severity='critical') AS critical, COUNT(*) FILTER (WHERE severity='high') AS high, COUNT(*) FILTER (WHERE status='open') AS open FROM incidents"),
    ]);
    const snapshot = {
      drones: drones.rows[0],
      flights: flights.rows[0],
      missions: missions.rows[0],
      incidents: incidents.rows[0],
      ...(req.body?.notes ? { notes: req.body.notes } : {}),
    };
    const result = await ai.executiveBrief(snapshot);
    const out = { snapshot, brief: result };
    await record('executive-brief', { notes: req.body?.notes || null }, out);
    res.json(out);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 6. POST /api/ai/payload-weight-optimize
router.post('/payload-weight-optimize', async (req, res) => {
  try {
    let { payloads, payloads_json, drone_spec } = req.body || {};
    if (!payloads && payloads_json) {
      try { payloads = JSON.parse(payloads_json); } catch (_) { payloads = []; }
    }
    if (!Array.isArray(payloads) || payloads.length === 0) {
      const r = await pool.query("SELECT * FROM packages WHERE status='pending' ORDER BY id ASC LIMIT 20");
      payloads = r.rows;
    }
    const result = await ai.payloadWeightOptimize(payloads, { notes: drone_spec || '' });
    await record('payload-weight-optimize', { count: payloads.length, drone_spec }, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 7. POST /api/ai/battery-cycle-prognostic
router.post('/battery-cycle-prognostic', async (req, res) => {
  try {
    let batteries = req.body?.batteries;
    if (!Array.isArray(batteries) || batteries.length === 0) {
      const r = await pool.query('SELECT * FROM batteries ORDER BY id ASC LIMIT 30');
      batteries = r.rows;
    }
    const result = await ai.batteryCyclePrognostic(batteries);
    await record('battery-cycle-prognostic', { count: batteries.length }, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 8. POST /api/ai/regulatory-checklist
router.post('/regulatory-checklist', async (req, res) => {
  try {
    const { mission_id = '', authority = 'FAA' } = req.body || {};
    let mission = { mission_id };
    if (mission_id) {
      try {
        const r = await pool.query('SELECT * FROM missions WHERE mission_id = $1 LIMIT 1', [mission_id]);
        if (r.rows.length) mission = r.rows[0];
      } catch (_) {}
    }
    const result = await ai.regulatoryChecklist(mission, authority);
    await record('regulatory-checklist', { mission_id, authority }, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 9. POST /api/ai/pilot-shift-schedule
router.post('/pilot-shift-schedule', async (req, res) => {
  try {
    const { constraints_notes = '' } = req.body || {};
    const pilots = await pool.query("SELECT pilot_id, name, base, status, certifications FROM pilots WHERE status IN ('active','on_shift')");
    const result = await ai.pilotShiftSchedule({ notes: constraints_notes, pilots: pilots.rows });
    await record('pilot-shift-schedule', { constraints_notes }, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 10. POST /api/ai/ground-observer-plan
router.post('/ground-observer-plan', async (req, res) => {
  try {
    const { corridor_notes = '', mission_id = '' } = req.body || {};
    const result = await ai.groundObserverPlan({ notes: corridor_notes }, { mission_id });
    await record('ground-observer-plan', { corridor_notes, mission_id }, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 11. POST /api/ai/conflict-airspace-detect
router.post('/conflict-airspace-detect', async (req, res) => {
  try {
    let { route_notes = '', zones, zones_json } = req.body || {};
    if (!zones && zones_json) {
      try { zones = JSON.parse(zones_json); } catch (_) { zones = []; }
    }
    if (!Array.isArray(zones) || zones.length === 0) {
      const r = await pool.query('SELECT * FROM airspace_zones LIMIT 20');
      zones = r.rows;
    }
    const result = await ai.conflictAirspaceDetect({ notes: route_notes }, zones);
    await record('conflict-airspace-detect', { route_notes, zone_count: zones.length }, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 12. POST /api/ai/customer-comms-draft
router.post('/customer-comms-draft', async (req, res) => {
  try {
    const { event_type = 'delivery_complete', mission_id = '', extra_notes = '' } = req.body || {};
    let mission = { mission_id };
    if (mission_id) {
      try {
        const r = await pool.query('SELECT * FROM missions WHERE mission_id = $1 LIMIT 1', [mission_id]);
        if (r.rows.length) mission = r.rows[0];
      } catch (_) {}
    }
    const result = await ai.customerCommsDraft(event_type, { ...mission, notes: extra_notes });
    await record('customer-comms-draft', { event_type, mission_id, extra_notes }, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 13. POST /api/ai/vertiport-capacity-plan
router.post('/vertiport-capacity-plan', async (req, res) => {
  try {
    const { vertiport_id = '', demand_notes = '' } = req.body || {};
    let vp = { vertiport_id };
    if (vertiport_id) {
      try {
        const r = await pool.query('SELECT * FROM vertiports WHERE vertiport_id = $1 LIMIT 1', [vertiport_id]);
        if (r.rows.length) vp = r.rows[0];
      } catch (_) {}
    }
    const result = await ai.vertiportCapacityPlan(vp, { notes: demand_notes });
    await record('vertiport-capacity-plan', { vertiport_id, demand_notes }, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 14. POST /api/ai/contingency-landing-plan
router.post('/contingency-landing-plan', async (req, res) => {
  try {
    const { route_notes = '', drone_spec = '' } = req.body || {};
    const result = await ai.contingencyLandingPlan({ notes: route_notes }, { notes: drone_spec });
    await record('contingency-landing-plan', { route_notes, drone_spec }, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 15. POST /api/ai/incident-post-mortem
router.post('/incident-post-mortem', async (req, res) => {
  try {
    const { incident_id = '', notes = '' } = req.body || {};
    let incident = { incident_id, notes };
    if (incident_id) {
      try {
        const r = await pool.query('SELECT * FROM incidents WHERE incident_id = $1 LIMIT 1', [incident_id]);
        if (r.rows.length) incident = { ...r.rows[0], notes };
      } catch (_) {}
    }
    const result = await ai.incidentPostMortem(incident);
    await record('incident-post-mortem', { incident_id, notes }, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 16. POST /api/ai/vendor-quality-score
router.post('/vendor-quality-score', async (req, res) => {
  try {
    const { vendor = '', metrics_notes = '' } = req.body || {};
    const result = await ai.vendorQualityScore({ name: vendor }, { notes: metrics_notes });
    await record('vendor-quality-score', { vendor, metrics_notes }, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Apply pass 7: 4 missing AI counterparts ──────────────────────────────

// 17. POST /api/ai/customer-eta-narrate
router.post('/customer-eta-narrate', async (req, res) => {
  try {
    const { mission_id = '', phase = '', distance_remaining_km = 0, wind_kt = 0, notes = '' } = req.body || {};
    let mission = { mission_id };
    if (mission_id) {
      try {
        const r = await pool.query('SELECT * FROM missions WHERE mission_id = $1 LIMIT 1', [mission_id]);
        if (r.rows.length) mission = r.rows[0];
      } catch (_) {}
    }
    const telemetry = { phase, distance_remaining_km, wind_kt, notes };
    const result = await ai.customerEtaNarrate(mission, telemetry);
    await record('customer-eta-narrate', { mission_id, phase, distance_remaining_km, wind_kt, notes }, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 18. POST /api/ai/weight-balance-advise
router.post('/weight-balance-advise', async (req, res) => {
  try {
    let { payloads, payloads_json, drone_spec } = req.body || {};
    if (!payloads && payloads_json) {
      try { payloads = JSON.parse(payloads_json); } catch (_) { payloads = []; }
    }
    if (!Array.isArray(payloads) || payloads.length === 0) {
      const r = await pool.query("SELECT * FROM packages WHERE status='pending' ORDER BY id ASC LIMIT 10");
      payloads = r.rows;
    }
    const result = await ai.weightBalanceAdvise(payloads, { notes: drone_spec || '' });
    await record('weight-balance-advise', { count: payloads.length, drone_spec }, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 19. POST /api/ai/delivery-window-predict
router.post('/delivery-window-predict', async (req, res) => {
  try {
    const { notes = '' } = req.body || {};
    let missions = [];
    try {
      const r = await pool.query("SELECT * FROM missions WHERE status IN ('planning','scheduled','in_flight') ORDER BY id ASC LIMIT 25");
      missions = r.rows;
    } catch (_) {}
    const result = await ai.deliveryWindowPredict(missions, { notes });
    await record('delivery-window-predict', { notes, mission_count: missions.length }, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 20. POST /api/ai/notam-aware-reroute
router.post('/notam-aware-reroute', async (req, res) => {
  try {
    let { route_notes = '', notams, notams_json, drone_spec = '' } = req.body || {};
    if (!notams && notams_json) {
      try { notams = JSON.parse(notams_json); } catch (_) { notams = []; }
    }
    if (!Array.isArray(notams)) notams = [];
    const result = await ai.notamAwareReroute({ notes: route_notes }, notams, { notes: drone_spec });
    await record('notam-aware-reroute', { route_notes, notam_count: notams.length, drone_spec }, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
