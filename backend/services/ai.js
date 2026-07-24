// AI helper service for AIDroneDeliveryLastMile
// Reads OPENROUTER_API_KEY and OPENROUTER_MODEL from:
//   1. this project's .env (already loaded by server.js)
//   2. fallback: /Users/erolakarsu/projects/beauty-wellness-ai/.env (canonical source)
// Never overwrites or wipes credentials.

const fs = require('fs');
const path = require('path');

const FALLBACK_ENV = '/Users/erolakarsu/projects/beauty-wellness-ai/.env';

function readFallbackEnv() {
  try {
    if (!fs.existsSync(FALLBACK_ENV)) return {};
    const raw = fs.readFileSync(FALLBACK_ENV, 'utf8');
    const out = {};
    for (const line of raw.split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      let val = m[2];
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
      out[m[1]] = val;
    }
    return out;
  } catch (e) {
    console.warn('[ai] fallback env read failed:', e.message);
    return {};
  }
}

function getOpenRouterCreds() {
  const fb = readFallbackEnv();
  const key = process.env.OPENROUTER_API_KEY || fb.OPENROUTER_API_KEY || '';
  const model = process.env.OPENROUTER_MODEL || fb.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5';
  const baseUrl = (process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1').replace(/\/$/, '');
  return { key, model, baseUrl };
}

const SYSTEM_PROMPT =
  'You are a senior BVLOS drone-delivery operations analyst supporting a Part 135 last-mile operator. ' +
  'You provide rigorous, ops-grade reasoning on fleet readiness, route corridors, weather windows, ' +
  'regulatory compliance, payload constraints, vertiport capacity, and incident response. ' +
  'Always return strict JSON in the exact schema requested. Treat every input as operational planning, never live tasking.';

function callOpenRouter(systemPrompt, userPrompt) {
  return new Promise((resolve) => {
    const { key, model, baseUrl } = getOpenRouterCreds();
    if (!key) {
      return resolve({ error: 'OPENROUTER_API_KEY not configured' });
    }
    const https = require('https');
    const payload = JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.6,
      max_tokens: 2000,
    });

    const apiUrl = new URL(`${baseUrl}/chat/completions`);
    const options = {
      hostname: apiUrl.hostname,
      port: apiUrl.port || undefined,
      path: `${apiUrl.pathname}${apiUrl.search}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        Authorization: `Bearer ${key}`,
        'HTTP-Referer': 'http://localhost:3090',
        'X-Title': 'AI Drone Delivery Last-Mile',
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (parsed.error) {
            return resolve({ error: parsed.error.message || 'OpenRouter error', raw: body });
          }
          const content = parsed.choices?.[0]?.message?.content || '';
          resolve(content);
        } catch (e) {
          resolve({ error: 'AI response parse failed', raw: body });
        }
      });
    });
    req.on('error', (e) => resolve({ error: e.message }));
    req.write(payload);
    req.end();
  });
}

function safeJsonParse(response, fallback) {
  if (response && typeof response === 'object' && response.error) {
    return { ...fallback, error: response.error };
  }
  if (response == null) return { ...fallback, summary: '' };
  if (typeof response === 'object') return response;
  const text = String(response).trim();
  try { return JSON.parse(text); } catch (_) {}
  try {
    const start = text.indexOf('{');
    if (start !== -1) {
      let depth = 0, inStr = false, esc = false;
      for (let i = start; i < text.length; i++) {
        const ch = text[i];
        if (esc) { esc = false; continue; }
        if (ch === '\\') { esc = true; continue; }
        if (ch === '"') { inStr = !inStr; continue; }
        if (inStr) continue;
        if (ch === '{') depth++;
        else if (ch === '}') { depth--; if (depth === 0) return JSON.parse(text.slice(start, i + 1)); }
      }
    }
  } catch (_) {}
  try {
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (fenced && fenced[1]) return JSON.parse(fenced[1].trim());
  } catch (_) {}
  return { ...fallback, summary: text };
}

// 1. Route Corridor Plan
async function routeCorridorPlan(origin, destination, context = {}) {
  const sys = `${SYSTEM_PROMPT} Generate a BVLOS route corridor plan. Return strict JSON:
{
  "corridor_name": string,
  "primary_route": { "waypoints": [string], "length_km": number, "altitude_ft_agl": number, "rationale": string },
  "alternates": [{ "name": string, "waypoints": [string], "trade_off": string }],
  "no_fly_zones": [{ "name": string, "reason": string }],
  "observer_posts": [{ "location": string, "purpose": string }],
  "go_no_go_recommendation": "go"|"caution"|"no_go",
  "summary": string
}`;
  const usr = `Origin: ${origin}\nDestination: ${destination}\nContext: ${JSON.stringify(context)}`;
  const r = await callOpenRouter(sys, usr);
  return safeJsonParse(r, { summary: typeof r === 'string' ? r : 'No response', alternates: [] });
}

// 2. Weather Flight Window
async function weatherFlightWindow(location, profile = {}) {
  const sys = `${SYSTEM_PROMPT} Identify the safest flight windows in the next 24h. Return strict JSON:
{
  "location": string,
  "windows": [{ "open": string, "close": string, "wind_kt": number, "ceiling_ft": number, "viz_sm": number, "verdict": "go"|"caution"|"no_go", "rationale": string }],
  "best_window": { "open": string, "close": string },
  "hazards": [string],
  "summary": string
}`;
  const usr = `Location: ${location}\nDrone profile / payload: ${JSON.stringify(profile)}`;
  const r = await callOpenRouter(sys, usr);
  return safeJsonParse(r, { summary: typeof r === 'string' ? r : 'No response', windows: [] });
}

// 3. Mission Brief
async function missionBrief(missionId, context = {}) {
  const sys = `${SYSTEM_PROMPT} Produce a pre-flight mission brief. Return strict JSON:
{
  "mission_id": string,
  "objective": string,
  "drone": { "model": string, "drone_id": string, "endurance_min": number },
  "route_summary": string,
  "payload": { "type": string, "weight_kg": number, "handling": string },
  "weather_summary": string,
  "regulatory_status": string,
  "risks": [{ "risk": string, "mitigation": string, "severity": "low"|"medium"|"high" }],
  "abort_criteria": [string],
  "summary": string
}`;
  const usr = `Mission ID: ${missionId}\nContext: ${JSON.stringify(context)}`;
  const r = await callOpenRouter(sys, usr);
  return safeJsonParse(r, { summary: typeof r === 'string' ? r : 'No response', risks: [] });
}

// 4. Anomaly Triage
async function anomalyTriage(telemetry = {}) {
  const sys = `${SYSTEM_PROMPT} Triage an in-flight anomaly from telemetry. Return strict JSON:
{
  "anomaly_classification": string,
  "severity": "low"|"medium"|"high"|"critical",
  "likely_cause": string,
  "immediate_actions": [string],
  "recovery_options": [{ "option": "continue"|"divert"|"land"|"rth"|"parachute", "rationale": string, "risk": "low"|"medium"|"high" }],
  "recommended_action": string,
  "notify": [string],
  "summary": string
}`;
  const usr = `Telemetry / event:\n${JSON.stringify(telemetry, null, 2)}`;
  const r = await callOpenRouter(sys, usr);
  return safeJsonParse(r, { summary: typeof r === 'string' ? r : 'No response', recovery_options: [] });
}

// 5. Executive Brief
async function executiveBrief(snapshot = {}) {
  const sys = `${SYSTEM_PROMPT} Produce an operator-level executive brief. Return strict JSON:
{
  "headline": string,
  "fleet_picture": { "ready_pct": number, "in_flight_pct": number, "maintenance_pct": number, "narrative": string },
  "delivery_throughput_today": { "scheduled": number, "completed": number, "aborted": number },
  "top_risks": [{ "risk": string, "severity": "low"|"medium"|"high"|"critical", "owner": string }],
  "decisions_required": [{ "decision": string, "deadline": string, "options": [string], "recommendation": string }],
  "next_24h_outlook": string,
  "summary": string
}`;
  const usr = `Operational snapshot:\n${JSON.stringify(snapshot, null, 2)}`;
  const r = await callOpenRouter(sys, usr);
  return safeJsonParse(r, { summary: typeof r === 'string' ? r : 'No response' });
}

// 6. Payload Weight Optimize
async function payloadWeightOptimize(payloads = [], droneSpec = {}) {
  const sys = `${SYSTEM_PROMPT} Optimize payload allocation across drones to maximize on-time delivery within MTOW. Return strict JSON:
{
  "assignments": [{ "package_id": string, "drone_id": string, "weight_kg": number, "rationale": string }],
  "rejected": [{ "package_id": string, "reason": string }],
  "total_weight_kg": number,
  "fleet_utilization_pct": number,
  "summary": string
}`;
  const usr = `Payloads:\n${JSON.stringify(payloads, null, 2)}\nDrone spec context:\n${JSON.stringify(droneSpec)}`;
  const r = await callOpenRouter(sys, usr);
  return safeJsonParse(r, { summary: typeof r === 'string' ? r : 'No response', assignments: [] });
}

// 7. Battery Cycle Prognostic
async function batteryCyclePrognostic(batteries = []) {
  const sys = `${SYSTEM_PROMPT} Predict battery state-of-health and replacement windows. Return strict JSON:
{
  "predictions": [{
    "battery_id": string,
    "drone_id": string,
    "predicted_remaining_cycles": number,
    "predicted_soh_pct_30d": number,
    "recommended_action": "keep"|"watch"|"replace_soon"|"retire",
    "rationale": string
  }],
  "fleet_avg_soh_pct": number,
  "replacements_next_30d": number,
  "summary": string
}`;
  const usr = `Batteries:\n${JSON.stringify(batteries, null, 2)}`;
  const r = await callOpenRouter(sys, usr);
  return safeJsonParse(r, { summary: typeof r === 'string' ? r : 'No response', predictions: [] });
}

// 8. Regulatory Checklist
async function regulatoryChecklist(mission, authority = 'FAA') {
  const sys = `${SYSTEM_PROMPT} Build a regulatory pre-flight checklist for a Part 135 / BVLOS authority. Return strict JSON:
{
  "authority": string,
  "checklist": [{ "item": string, "required": boolean, "status": "pass"|"fail"|"unknown", "evidence_required": string }],
  "gaps": [string],
  "estimated_filing_lead_time_days": number,
  "summary": string
}`;
  const usr = `Mission:\n${JSON.stringify(mission, null, 2)}\nAuthority: ${authority}`;
  const r = await callOpenRouter(sys, usr);
  return safeJsonParse(r, { summary: typeof r === 'string' ? r : 'No response', checklist: [] });
}

// 9. Pilot Shift Schedule
async function pilotShiftSchedule(constraints = {}) {
  const sys = `${SYSTEM_PROMPT} Generate a 7-day pilot shift schedule. Return strict JSON:
{
  "shifts": [{ "date": string, "shift": "AM"|"PM"|"NIGHT", "pilot_id": string, "base": string }],
  "coverage_gaps": [{ "date": string, "shift": string, "reason": string }],
  "compliance": { "rest_rules_ok": boolean, "max_hours_ok": boolean, "notes": string },
  "summary": string
}`;
  const usr = `Constraints:\n${JSON.stringify(constraints, null, 2)}`;
  const r = await callOpenRouter(sys, usr);
  return safeJsonParse(r, { summary: typeof r === 'string' ? r : 'No response', shifts: [] });
}

// 10. Ground Observer Plan
async function groundObserverPlan(corridor, mission = {}) {
  const sys = `${SYSTEM_PROMPT} Plan ground-observer placement for a BVLOS corridor (where required). Return strict JSON:
{
  "corridor": string,
  "observers": [{ "location": string, "purpose": string, "comms": string, "shift": string }],
  "blind_spots": [string],
  "minimum_required": number,
  "summary": string
}`;
  const usr = `Corridor:\n${JSON.stringify(corridor, null, 2)}\nMission:\n${JSON.stringify(mission)}`;
  const r = await callOpenRouter(sys, usr);
  return safeJsonParse(r, { summary: typeof r === 'string' ? r : 'No response', observers: [] });
}

// 11. Conflict Airspace Detect
async function conflictAirspaceDetect(route, zones = []) {
  const sys = `${SYSTEM_PROMPT} Detect airspace conflicts along a planned route. Return strict JSON:
{
  "conflicts": [{ "zone_id": string, "name": string, "classification": string, "issue": string, "severity": "low"|"medium"|"high" }],
  "deconfliction_actions": [{ "action": string, "owner": string, "lead_time_hours": number }],
  "go_no_go_recommendation": "go"|"caution"|"no_go",
  "summary": string
}`;
  const usr = `Route:\n${JSON.stringify(route, null, 2)}\nAirspace zones:\n${JSON.stringify(zones, null, 2)}`;
  const r = await callOpenRouter(sys, usr);
  return safeJsonParse(r, { summary: typeof r === 'string' ? r : 'No response', conflicts: [] });
}

// 12. Customer Comms Draft
async function customerCommsDraft(eventType, mission = {}) {
  const sys = `${SYSTEM_PROMPT} Draft a customer-facing comms message for a delivery event. Return strict JSON:
{
  "event_type": string,
  "channel": "sms"|"email"|"app_push",
  "subject": string,
  "body": string,
  "next_step_cta": string,
  "internal_notes": string,
  "summary": string
}`;
  const usr = `Event type: ${eventType}\nMission:\n${JSON.stringify(mission, null, 2)}`;
  const r = await callOpenRouter(sys, usr);
  return safeJsonParse(r, { summary: typeof r === 'string' ? r : 'No response' });
}

// 13. Vertiport Capacity Plan
async function vertiportCapacityPlan(vertiport, demand = {}) {
  const sys = `${SYSTEM_PROMPT} Forecast vertiport capacity vs demand and recommend slot allocation. Return strict JSON:
{
  "vertiport_id": string,
  "pads_available": number,
  "predicted_peak_arrivals_per_hour": number,
  "slot_plan": [{ "hour": string, "slots_used": number, "queue_risk": "low"|"medium"|"high" }],
  "bottlenecks": [string],
  "recommendations": [string],
  "summary": string
}`;
  const usr = `Vertiport:\n${JSON.stringify(vertiport, null, 2)}\nDemand:\n${JSON.stringify(demand)}`;
  const r = await callOpenRouter(sys, usr);
  return safeJsonParse(r, { summary: typeof r === 'string' ? r : 'No response', slot_plan: [] });
}

// 14. Contingency Landing Plan
async function contingencyLandingPlan(route, droneSpec = {}) {
  const sys = `${SYSTEM_PROMPT} Plan contingency-landing zones along a BVLOS corridor. Return strict JSON:
{
  "corridor": string,
  "landing_zones": [{ "location": string, "type": "primary"|"alternate", "surface": string, "approach_risk": "low"|"medium"|"high", "rationale": string }],
  "fail_safe_logic": [{ "trigger": string, "action": string }],
  "summary": string
}`;
  const usr = `Route:\n${JSON.stringify(route, null, 2)}\nDrone spec:\n${JSON.stringify(droneSpec)}`;
  const r = await callOpenRouter(sys, usr);
  return safeJsonParse(r, { summary: typeof r === 'string' ? r : 'No response', landing_zones: [] });
}

// 15. Incident Post-Mortem
async function incidentPostMortem(incident = {}) {
  const sys = `${SYSTEM_PROMPT} Produce a root-cause post-mortem for an incident. Return strict JSON:
{
  "incident_id": string,
  "timeline": [{ "ts": string, "event": string }],
  "root_cause": string,
  "contributing_factors": [string],
  "corrective_actions": [{ "action": string, "owner": string, "due": string }],
  "lessons_learned": [string],
  "reportable_to": [string],
  "summary": string
}`;
  const usr = `Incident:\n${JSON.stringify(incident, null, 2)}`;
  const r = await callOpenRouter(sys, usr);
  return safeJsonParse(r, { summary: typeof r === 'string' ? r : 'No response', timeline: [] });
}

// 16. Vendor Quality Score
async function vendorQualityScore(vendor, metrics = {}) {
  const sys = `${SYSTEM_PROMPT} Score a supplier / vendor on quality, on-time delivery and safety. Return strict JSON:
{
  "vendor": string,
  "overall_score": number,
  "scores": { "quality": number, "on_time": number, "safety": number, "support": number },
  "strengths": [string],
  "concerns": [string],
  "recommendation": "preferred"|"approved"|"watch"|"avoid",
  "summary": string
}`;
  const usr = `Vendor:\n${JSON.stringify(vendor, null, 2)}\nMetrics:\n${JSON.stringify(metrics, null, 2)}`;
  const r = await callOpenRouter(sys, usr);
  return safeJsonParse(r, { summary: typeof r === 'string' ? r : 'No response', scores: {} });
}

// ─── Apply pass 7: 4 missing AI counterparts ──────────────────────────────

// 17. Customer ETA Narrator — natural-language ETA updates tied to in-flight progress
async function customerEtaNarrate(mission = {}, telemetry = {}) {
  const sys = `${SYSTEM_PROMPT} Generate a short, customer-friendly ETA narration for an in-flight delivery. Return strict JSON:
{
  "mission_id": string,
  "current_phase": "preflight"|"climb"|"cruise"|"approach"|"landing"|"completed"|"aborted",
  "eta_minutes": number,
  "confidence": "low"|"medium"|"high",
  "headline": string,
  "narration": string,
  "next_update_in_min": number,
  "summary": string
}`;
  const usr = `Mission:\n${JSON.stringify(mission, null, 2)}\nTelemetry:\n${JSON.stringify(telemetry, null, 2)}`;
  const r = await callOpenRouter(sys, usr);
  return safeJsonParse(r, { summary: typeof r === 'string' ? r : 'No response' });
}

// 18. Weight & Balance Advisor — CG calculation + load placement guidance
async function weightBalanceAdvise(payloads = [], droneSpec = {}) {
  const sys = `${SYSTEM_PROMPT} Compute load placement / CG (center of gravity) advisory for a multi-package payload. Return strict JSON:
{
  "drone": string,
  "mtow_kg": number,
  "total_payload_kg": number,
  "cg_offset_cm": number,
  "cg_within_envelope": boolean,
  "load_plan": [{ "package_id": string, "bay": string, "weight_kg": number, "moment_arm_cm": number, "rationale": string }],
  "warnings": [string],
  "summary": string
}`;
  const usr = `Drone spec / envelope:\n${JSON.stringify(droneSpec, null, 2)}\nPayloads:\n${JSON.stringify(payloads, null, 2)}`;
  const r = await callOpenRouter(sys, usr);
  return safeJsonParse(r, { summary: typeof r === 'string' ? r : 'No response', load_plan: [] });
}

// 19. Delivery-window Predictor — probabilistic on-time across pending missions
async function deliveryWindowPredict(missions = [], context = {}) {
  const sys = `${SYSTEM_PROMPT} Predict on-time delivery probability and likely window for each pending mission. Return strict JSON:
{
  "predictions": [{
    "mission_id": string,
    "on_time_prob_pct": number,
    "predicted_window": { "earliest": string, "latest": string },
    "drivers": [string],
    "risk": "low"|"medium"|"high"
  }],
  "fleet_on_time_pct": number,
  "summary": string
}`;
  const usr = `Pending missions:\n${JSON.stringify(missions, null, 2)}\nContext:\n${JSON.stringify(context, null, 2)}`;
  const r = await callOpenRouter(sys, usr);
  return safeJsonParse(r, { summary: typeof r === 'string' ? r : 'No response', predictions: [] });
}

// 20. NOTAM-aware route re-optimizer — re-route given live NOTAMs
async function notamAwareReroute(route = {}, notams = [], droneSpec = {}) {
  const sys = `${SYSTEM_PROMPT} Re-optimize a planned route corridor given live NOTAMs / TFRs. Return strict JSON:
{
  "original_corridor": string,
  "notam_hits": [{ "notam_id": string, "summary": string, "severity": "low"|"medium"|"high", "action": "avoid"|"transit"|"delay" }],
  "reoptimized_route": { "waypoints": [string], "length_km": number, "altitude_ft_agl": number, "rationale": string },
  "delta_vs_original": { "extra_km": number, "extra_minutes": number },
  "go_no_go_recommendation": "go"|"caution"|"no_go",
  "summary": string
}`;
  const usr = `Route:\n${JSON.stringify(route, null, 2)}\nNOTAMs:\n${JSON.stringify(notams, null, 2)}\nDrone spec:\n${JSON.stringify(droneSpec, null, 2)}`;
  const r = await callOpenRouter(sys, usr);
  return safeJsonParse(r, { summary: typeof r === 'string' ? r : 'No response', notam_hits: [] });
}

module.exports = {
  callOpenRouter,
  safeJsonParse,
  routeCorridorPlan,
  weatherFlightWindow,
  missionBrief,
  anomalyTriage,
  executiveBrief,
  payloadWeightOptimize,
  batteryCyclePrognostic,
  regulatoryChecklist,
  pilotShiftSchedule,
  groundObserverPlan,
  conflictAirspaceDetect,
  customerCommsDraft,
  vertiportCapacityPlan,
  contingencyLandingPlan,
  incidentPostMortem,
  vendorQualityScore,
  // Apply pass 7
  customerEtaNarrate,
  weightBalanceAdvise,
  deliveryWindowPredict,
  notamAwareReroute,
};
