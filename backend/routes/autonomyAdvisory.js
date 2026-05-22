// Apply pass 7 — Autonomy ADVISORY ONLY.
// Per audit-note TOO-RISKY items: BVLOS feasibility, RTL arbiter, swarm
// deconfliction, geofence advisor, energy budget, density bundling.
//
// IMPORTANT: every endpoint here is ADVISORY ONLY. Every response carries
// `advisory_only: true` and an `operator_must_review: true` flag. Nothing here
// commands a drone, alters live tasking, or auto-executes — all outputs are
// recommendations for a remote pilot in command to accept or reject.
//
// Logic is deterministic and dependency-free; no AI call, no live actuation.

const express = require('express');
const router = express.Router();

function advisoryWrap(payload) {
  return {
    advisory_only: true,
    operator_must_review: true,
    generated_at: new Date().toISOString(),
    ...payload,
  };
}

// ─── BVLOS planner feasibility score (advisory) ───────────────────────────
// Body: { corridor_km, observers_count, waiver_active, comms_relays, urban_density }
router.post('/bvlos-feasibility', (req, res) => {
  try {
    const b = req.body || {};
    const km = Number(b.corridor_km) || 0;
    const obs = Number(b.observers_count) || 0;
    const waiver = b.waiver_active === true || b.waiver_active === 'true';
    const relays = Number(b.comms_relays) || 0;
    const density = String(b.urban_density || 'suburban').toLowerCase();

    let score = 50;
    if (waiver) score += 25; else score -= 25;
    score += Math.min(20, relays * 5);
    if (km > 0) score += Math.min(15, Math.floor(obs / Math.max(1, km / 5)) * 5);
    if (density === 'rural') score += 10;
    else if (density === 'urban') score -= 10;
    else if (density === 'dense_urban') score -= 20;
    score = Math.max(0, Math.min(100, score));

    let verdict = 'no_go';
    if (score >= 75) verdict = 'go';
    else if (score >= 55) verdict = 'caution';

    res.json(advisoryWrap({
      feature: 'bvlos-feasibility',
      inputs: { corridor_km: km, observers_count: obs, waiver_active: waiver, comms_relays: relays, urban_density: density },
      feasibility_score: score,
      verdict,
      drivers: [
        `Waiver: ${waiver ? '+25' : '-25'}`,
        `Comms relays: +${Math.min(20, relays * 5)}`,
        `Observer density: +${km > 0 ? Math.min(15, Math.floor(obs / Math.max(1, km / 5)) * 5) : 0}`,
        `Urban density (${density}): ${density === 'rural' ? '+10' : density === 'urban' ? '-10' : density === 'dense_urban' ? '-20' : '0'}`,
      ],
      note: 'Advisory only. A qualified BVLOS pilot must approve any go decision.',
    }));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Return-to-launch arbiter (advisory) ──────────────────────────────────
// Body: { battery_pct, comms_link_ok, wind_kt, distance_home_km, payload_critical }
router.post('/rtl-arbiter', (req, res) => {
  try {
    const b = req.body || {};
    const battery = Number(b.battery_pct);
    const commsOk = b.comms_link_ok === true || b.comms_link_ok === 'true';
    const wind = Number(b.wind_kt) || 0;
    const homeKm = Number(b.distance_home_km) || 0;
    const payloadCritical = b.payload_critical === true || b.payload_critical === 'true';

    // Battery reserve needed: 25% baseline + 1% per km home + 1% per kt wind > 10
    const reserve = 25 + homeKm + Math.max(0, wind - 10);
    const battOk = Number.isFinite(battery) ? battery >= reserve : false;

    let recommendation = 'continue';
    const reasons = [];
    if (!Number.isFinite(battery)) {
      recommendation = 'land';
      reasons.push('battery_pct missing or invalid');
    } else if (battery < reserve) {
      recommendation = battery < (reserve * 0.6) ? 'parachute' : 'rth';
      reasons.push(`battery ${battery.toFixed(1)}% < reserve ${reserve.toFixed(1)}%`);
    }
    if (!commsOk) {
      // Comms loss escalates from continue to RTH to land
      if (recommendation === 'continue') recommendation = 'rth';
      reasons.push('C2 link not OK');
    }
    if (wind > 25) {
      if (recommendation === 'continue') recommendation = 'divert';
      reasons.push(`wind ${wind}kt > 25kt envelope`);
    }
    if (payloadCritical && recommendation === 'parachute') {
      recommendation = 'rth';
      reasons.push('payload critical → prefer RTH over parachute');
    }

    res.json(advisoryWrap({
      feature: 'rtl-arbiter',
      inputs: { battery_pct: battery, comms_link_ok: commsOk, wind_kt: wind, distance_home_km: homeKm, payload_critical: payloadCritical },
      reserve_required_pct: Number(reserve.toFixed(1)),
      battery_ok: battOk,
      recommendation, // continue|divert|rth|land|parachute
      reasons,
      note: 'Advisory only. Final decision rests with the pilot in command.',
    }));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Multi-drone swarm deconfliction (advisory) ───────────────────────────
// Body: { trajectories: [{ drone_id, waypoints: [{ lat, lon, alt_m, t_iso }] }] }
router.post('/swarm-deconflict', (req, res) => {
  try {
    const trajectories = Array.isArray(req.body?.trajectories) ? req.body.trajectories : [];
    const conflicts = [];
    // O(n^2) coarse 4D proximity check — same minute bucket + altitude ±30m + ground distance < 200m
    const buckets = new Map();
    for (const t of trajectories) {
      for (const wp of (t.waypoints || [])) {
        if (!wp || wp.lat == null || wp.lon == null || !wp.t_iso) continue;
        const ts = new Date(wp.t_iso).getTime();
        if (!Number.isFinite(ts)) continue;
        const bk = Math.floor(ts / 60000); // 1-min bucket
        if (!buckets.has(bk)) buckets.set(bk, []);
        buckets.get(bk).push({ drone_id: t.drone_id, ...wp, ts });
      }
    }
    for (const [bk, pts] of buckets.entries()) {
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const a = pts[i];
          const b = pts[j];
          if (a.drone_id === b.drone_id) continue;
          // Haversine (m)
          const R = 6371000;
          const toRad = (x) => (x * Math.PI) / 180;
          const dLat = toRad(b.lat - a.lat);
          const dLon = toRad(b.lon - a.lon);
          const h = Math.sin(dLat / 2) ** 2 +
                    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
          const dist = 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
          const dAlt = Math.abs((a.alt_m || 0) - (b.alt_m || 0));
          if (dist < 200 && dAlt < 30) {
            conflicts.push({
              bucket_minute: bk,
              drone_a: a.drone_id,
              drone_b: b.drone_id,
              distance_m: Math.round(dist),
              altitude_delta_m: Math.round(dAlt),
              severity: dist < 50 ? 'high' : dist < 100 ? 'medium' : 'low',
            });
          }
        }
      }
    }
    res.json(advisoryWrap({
      feature: 'swarm-deconflict',
      trajectory_count: trajectories.length,
      conflict_count: conflicts.length,
      conflicts,
      note: 'Coarse 4D proximity advisory. Not a substitute for certified DAA/UTM service.',
    }));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Geofence advisor (advisory) ──────────────────────────────────────────
// Body: { route_centerline_km, school_count, hospital_count, population_density }
router.post('/geofence-advise', (req, res) => {
  try {
    const b = req.body || {};
    const km = Number(b.route_centerline_km) || 0;
    const schools = Number(b.school_count) || 0;
    const hospitals = Number(b.hospital_count) || 0;
    const pop = String(b.population_density || 'suburban').toLowerCase();

    // Baseline corridor half-width (m)
    let halfWidth = 75;
    if (pop === 'rural') halfWidth = 150;
    else if (pop === 'urban') halfWidth = 50;
    else if (pop === 'dense_urban') halfWidth = 30;

    // Per-sensitive-feature buffer
    const schoolBuffer = 250;
    const hospitalBuffer = 150;

    res.json(advisoryWrap({
      feature: 'geofence-advise',
      inputs: { route_centerline_km: km, school_count: schools, hospital_count: hospitals, population_density: pop },
      corridor_half_width_m: halfWidth,
      sensitive_buffers_m: { school: schoolBuffer, hospital: hospitalBuffer },
      polygon_recommendation: `Construct corridor polygon = centerline ± ${halfWidth}m, with avoidance buffers of ${schoolBuffer}m around schools and ${hospitalBuffer}m around hospitals.`,
      note: 'Advisory only. Final geofence requires GIS overlay + airspace authority sign-off.',
    }));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Energy budget optimizer (advisory) ───────────────────────────────────
// Body: { fleet_size, avg_cycle_hours, swap_pack_count, vertiport_chargers }
router.post('/energy-budget', (req, res) => {
  try {
    const b = req.body || {};
    const fleet = Number(b.fleet_size) || 0;
    const cycle = Number(b.avg_cycle_hours) || 0.5;
    const swaps = Number(b.swap_pack_count) || 0;
    const chargers = Number(b.vertiport_chargers) || 0;

    // Hourly throughput cap:
    //   - swap-based:    swaps / 0.05hr/swap_op (3 min)
    //   - charge-based:  chargers / cycle
    const swapHourly = swaps > 0 ? Math.floor(swaps / 0.05) : 0;
    const chargeHourly = chargers > 0 ? Math.floor(chargers / Math.max(0.25, cycle)) : 0;
    const totalHourly = swapHourly + chargeHourly;
    const utilization = fleet > 0 ? Math.min(100, Math.round((totalHourly / fleet) * 100)) : 0;

    res.json(advisoryWrap({
      feature: 'energy-budget',
      inputs: { fleet_size: fleet, avg_cycle_hours: cycle, swap_pack_count: swaps, vertiport_chargers: chargers },
      throughput_per_hour: { swap_based: swapHourly, charge_based: chargeHourly, total: totalHourly },
      fleet_utilization_pct: utilization,
      recommendation: swapHourly >= chargeHourly
        ? 'Prefer swap-based ops for peak; reserve chargers for overnight equalize.'
        : 'Charger throughput dominates; consider adding swap packs for surge windows.',
      note: 'Advisory only. Calibrate constants against actual telemetry before scheduling.',
    }));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Delivery-density route bundling (advisory) ───────────────────────────
// Body: { orders: [{ order_id, lat, lon, weight_kg }], cluster_radius_km, max_payload_kg }
router.post('/density-bundle', (req, res) => {
  try {
    const orders = Array.isArray(req.body?.orders) ? req.body.orders : [];
    const radius = Number(req.body?.cluster_radius_km) || 1.5;
    const maxKg = Number(req.body?.max_payload_kg) || 4.0;

    // Greedy grid-clustering: round to nearest 0.01° (~1.1km) + radius factor
    const grid = Math.max(0.005, radius / 111);
    const clusters = new Map();
    for (const o of orders) {
      if (o.lat == null || o.lon == null) continue;
      const key = `${Math.round(o.lat / grid)}|${Math.round(o.lon / grid)}`;
      if (!clusters.has(key)) clusters.set(key, []);
      clusters.get(key).push(o);
    }
    const bundles = [];
    for (const [key, items] of clusters.entries()) {
      // Sub-split if total > max payload
      let cur = { ids: [], total_kg: 0 };
      for (const o of items) {
        const w = Number(o.weight_kg) || 0;
        if (cur.total_kg + w > maxKg && cur.ids.length > 0) {
          bundles.push(cur);
          cur = { ids: [], total_kg: 0 };
        }
        cur.ids.push(o.order_id);
        cur.total_kg += w;
      }
      if (cur.ids.length > 0) bundles.push(cur);
    }
    res.json(advisoryWrap({
      feature: 'density-bundle',
      orders_in: orders.length,
      cluster_radius_km: radius,
      max_payload_kg: maxKg,
      bundle_count: bundles.length,
      bundles,
      note: 'Advisory only. Validate against time windows, customer SLA, and drone MTOW.',
    }));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
