// Apply pass 7 — Vertiport scheduling slots + deterministic conflict detector.
// CRUD via factory. Additional GET /conflicts endpoint surfaces pad-collision
// windows without any AI involvement (NEEDS-PRODUCT-DECISION: rule chosen is
// "two reserved/confirmed slots overlap on the same vertiport_id+pad_index").

const express = require('express');
const pool = require('../config/database');
const buildCrud = require('./_crudFactory');

const crud = buildCrud({
  table: 'vertiport_slots',
  fields: [
    'slot_id',
    'vertiport_id',
    'pad_index',
    'mission_id',
    'drone_id',
    'slot_type',
    'window_start',
    'window_end',
    'status',
    'priority',
    'notes',
  ],
});

const router = express.Router();

// GET /api/vertiport-slots/conflicts?vertiport_id=<id>
// Deterministic conflict detection: two slots collide when
//   - same vertiport_id
//   - same pad_index
//   - status IN ('reserved','confirmed')
//   - windows overlap (start < other.end AND end > other.start)
// Returns array of { a, b, overlap_seconds, severity }.
// `severity` is rule-based:
//   - 'high'    if both confirmed
//   - 'medium'  if one confirmed
//   - 'low'     if both only reserved
router.get('/conflicts', async (req, res) => {
  try {
    const vertiportId = (req.query.vertiport_id || '').toString();
    const params = [];
    let where = `WHERE status IN ('reserved','confirmed')
                   AND window_start IS NOT NULL
                   AND window_end   IS NOT NULL`;
    if (vertiportId) {
      params.push(vertiportId);
      where += ` AND vertiport_id = $${params.length}`;
    }
    const r = await pool.query(
      `SELECT id, slot_id, vertiport_id, pad_index, mission_id, drone_id,
              slot_type, window_start, window_end, status, priority
         FROM vertiport_slots
         ${where}
         ORDER BY vertiport_id ASC, pad_index ASC, window_start ASC`,
      params
    );
    const rows = r.rows;
    const conflicts = [];
    for (let i = 0; i < rows.length; i++) {
      for (let j = i + 1; j < rows.length; j++) {
        const a = rows[i];
        const b = rows[j];
        if (a.vertiport_id !== b.vertiport_id) continue;
        if ((a.pad_index || 1) !== (b.pad_index || 1)) continue;
        const aStart = new Date(a.window_start).getTime();
        const aEnd = new Date(a.window_end).getTime();
        const bStart = new Date(b.window_start).getTime();
        const bEnd = new Date(b.window_end).getTime();
        if (!(aStart < bEnd && aEnd > bStart)) continue;
        const overlap = Math.max(0, Math.min(aEnd, bEnd) - Math.max(aStart, bStart));
        let severity = 'low';
        if (a.status === 'confirmed' && b.status === 'confirmed') severity = 'high';
        else if (a.status === 'confirmed' || b.status === 'confirmed') severity = 'medium';
        conflicts.push({
          a,
          b,
          overlap_seconds: Math.round(overlap / 1000),
          severity,
        });
      }
    }
    res.json({
      filter: vertiportId ? { vertiport_id: vertiportId } : null,
      slot_count: rows.length,
      conflict_count: conflicts.length,
      conflicts,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Delegate the rest to the CRUD router (must come AFTER /conflicts to avoid
// /conflicts being parsed as :id).
router.use('/', crud);

module.exports = router;
