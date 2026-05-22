// Apply pass 7 — FAA Part 135 consolidated records ledger.
// Pilot duty time, aircraft airworthiness, training records, medical certificates,
// checkrides. Audit-trail style, append-only writes via CRUD factory.

const buildCrud = require('./_crudFactory');

module.exports = buildCrud({
  table: 'part135_records',
  fields: [
    'record_id',
    'record_type',
    'subject_type',
    'subject_id',
    'period_start',
    'period_end',
    'hours_logged',
    'status',
    'authority',
    'reference',
    'evidence_url',
    'notes',
  ],
});
