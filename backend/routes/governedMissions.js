'use strict';

const crypto = require('crypto');
const express = require('express');
const pool = require('../config/database');
const { requireRole } = require('../middleware/auth');
const { validateMission, validateSafetySnapshot, assertMissionChecks, assertTransition } = require('../domain/missionWorkflow');

const router = express.Router();
const writers = requireRole('pilot', 'admin');
const actor = (req) => String(req.user.id);
const fail = (res, error) => res.status(/not found/i.test(error.message) ? 404 : /Only admin|distinct|Role/i.test(error.message) ? 403 : 400).json({ error: error.message });
async function audit(client, req, id, event, from, to, detail = {}) {
  await client.query(`INSERT INTO governed_mission_audit
    (mission_id,tenant_id,actor_id,actor_role,event_type,from_status,to_status,detail) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
  [id, req.user.tenant_id, actor(req), req.user.role, event, from, to, detail]);
}
async function transact(req, res, callback) {
  let client;
  try { client = await pool.connect(); await client.query('BEGIN'); const result = await callback(client); await client.query('COMMIT'); return result; }
  catch (error) { if (client) await client.query('ROLLBACK'); return fail(res, error); }
  finally { if (client) client.release(); }
}

router.get('/', async (req, res) => {
  try { const result = await pool.query('SELECT * FROM governed_missions WHERE tenant_id=$1 ORDER BY updated_at DESC LIMIT 200', [req.user.tenant_id]); return res.json(result.rows); }
  catch (_) { return res.status(500).json({ error: 'Unable to list governed missions' }); }
});
router.get('/:id', async (req, res) => {
  try {
    const [mission, telemetry, auditRows] = await Promise.all([
      pool.query('SELECT * FROM governed_missions WHERE id=$1 AND tenant_id=$2', [req.params.id, req.user.tenant_id]),
      pool.query('SELECT * FROM governed_mission_telemetry WHERE mission_id=$1 AND tenant_id=$2 ORDER BY sequence_no', [req.params.id, req.user.tenant_id]),
      pool.query('SELECT * FROM governed_mission_audit WHERE mission_id=$1 AND tenant_id=$2 ORDER BY created_at', [req.params.id, req.user.tenant_id]),
    ]);
    if (!mission.rows[0]) return res.status(404).json({ error: 'Mission not found' });
    return res.json({ mission: mission.rows[0], telemetry: telemetry.rows, audit: auditRows.rows });
  } catch (_) { return res.status(500).json({ error: 'Unable to load governed mission' }); }
});
router.post('/', writers, async (req, res) => {
  try {
    const mission = validateMission(req.body?.mission); const id = crypto.randomUUID();
    return transact(req, res, async (client) => {
      const result = await client.query(`INSERT INTO governed_missions
        (id,tenant_id,external_ref,drone_ref,route,payload_kg,max_payload_kg,planned_energy_wh,reserve_energy_wh,created_by)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [id, req.user.tenant_id, mission.external_ref, mission.drone_ref, mission.route, mission.payload_kg, mission.max_payload_kg, mission.planned_energy_wh, mission.reserve_energy_wh, actor(req)]);
      await audit(client, req, id, 'mission.created', null, 'draft', { external_ref: mission.external_ref });
      return res.status(201).json(result.rows[0]);
    });
  } catch (error) { return fail(res, error); }
});
router.post('/:id/validate', writers, (req, res) => transact(req, res, async (client) => {
  const found = await client.query('SELECT * FROM governed_missions WHERE id=$1 AND tenant_id=$2 FOR UPDATE', [req.params.id, req.user.tenant_id]);
  const mission = found.rows[0]; if (!mission) throw new Error('Mission not found');
  assertTransition(mission.status, 'validated', req.user.role);
  const snapshot = validateSafetySnapshot(req.body?.safety_snapshot);
  assertMissionChecks(mission, snapshot);
  const updated = await client.query("UPDATE governed_missions SET safety_snapshot=$1,status='validated',version=version+1,updated_at=NOW() WHERE id=$2 AND tenant_id=$3 RETURNING *", [snapshot, req.params.id, req.user.tenant_id]);
  await audit(client, req, req.params.id, 'mission.validated', mission.status, 'validated', { source: snapshot.source, expires_at: snapshot.expires_at });
  return res.json(updated.rows[0]);
}));
router.post('/:id/transition', writers, (req, res) => transact(req, res, async (client) => {
  const found = await client.query('SELECT * FROM governed_missions WHERE id=$1 AND tenant_id=$2 FOR UPDATE', [req.params.id, req.user.tenant_id]);
  const mission = found.rows[0]; if (!mission) throw new Error('Mission not found');
  const to = String(req.body?.to || ''); assertTransition(mission.status, to, req.user.role);
  let approvedBy = mission.approved_by; let releasedBy = mission.released_by; let outcome = mission.outcome; let contingency = mission.contingency; let failure = mission.failure_reason;
  if (to === 'approved') { if (actor(req) === String(mission.created_by)) throw new Error('Approver must be distinct from planner'); approvedBy = actor(req); }
  if (to === 'released') { if (new Date(mission.safety_snapshot?.expires_at) <= new Date()) throw new Error('safety snapshot has expired'); releasedBy = actor(req); }
  if (to === 'contingency') contingency = { type: String(req.body?.contingency?.type || '').slice(0, 100), note: String(req.body?.contingency?.note || '').slice(0, 2000), observed_at: new Date(req.body?.contingency?.observed_at || Date.now()).toISOString() };
  if (to === 'completed') { const ext = req.body?.external_result; if (!ext || typeof ext.operator_ref !== 'string' || !ext.operator_ref.trim()) throw new Error('external_result.operator_ref is required'); outcome = { operator_ref: ext.operator_ref.slice(0, 200), observed_at: new Date(ext.observed_at || Date.now()).toISOString(), note: String(ext.note || '').slice(0, 2000) }; }
  if (to === 'failed' || to === 'aborted') { if (typeof req.body?.reason !== 'string' || !req.body.reason.trim()) throw new Error('reason is required'); failure = req.body.reason.slice(0, 2000); }
  const updated = await client.query(`UPDATE governed_missions SET status=$1,approved_by=$2,released_by=$3,outcome=$4,contingency=$5,failure_reason=$6,version=version+1,updated_at=NOW()
    WHERE id=$7 AND tenant_id=$8 RETURNING *`, [to, approvedBy, releasedBy, outcome, contingency, failure, req.params.id, req.user.tenant_id]);
  await audit(client, req, req.params.id, 'mission.transitioned', mission.status, to, { external_action: false });
  return res.json(updated.rows[0]);
}));
router.post('/:id/telemetry', writers, (req, res) => transact(req, res, async (client) => {
  const body = req.body || {}; const mission = await client.query('SELECT status FROM governed_missions WHERE id=$1 AND tenant_id=$2 FOR UPDATE', [req.params.id, req.user.tenant_id]);
  if (!mission.rows[0]) throw new Error('Mission not found'); if (!['released','monitoring','contingency'].includes(mission.rows[0].status)) throw new Error('Mission is not accepting telemetry');
  const observed = new Date(body.observed_at); if (!Number.isFinite(observed.getTime())) throw new Error('observed_at is invalid');
  const numbers = [body.sequence_no, body.latitude, body.longitude, body.altitude_m, body.battery_percent].map(Number);
  if (!numbers.every(Number.isFinite) || numbers[0] < 0 || numbers[1] < -90 || numbers[1] > 90 || numbers[2] < -180 || numbers[2] > 180 || numbers[4] < 0 || numbers[4] > 100) throw new Error('telemetry values are invalid');
  if (typeof body.source !== 'string' || !body.source.trim()) throw new Error('source is required');
  const id = crypto.randomUUID(); const result = await client.query(`INSERT INTO governed_mission_telemetry
    (id,mission_id,tenant_id,sequence_no,observed_at,latitude,longitude,altitude_m,battery_percent,communications_status,source)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`, [id, req.params.id, req.user.tenant_id, numbers[0], observed.toISOString(), numbers[1], numbers[2], numbers[3], numbers[4], String(body.communications_status || '').slice(0, 40), body.source.slice(0, 200)]);
  await audit(client, req, req.params.id, 'telemetry.recorded', mission.rows[0].status, mission.rows[0].status, { sequence_no: numbers[0], source: body.source.slice(0, 200) });
  return res.status(201).json(result.rows[0]);
}));

module.exports = router;
