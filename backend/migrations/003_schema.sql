-- AIDroneDeliveryLastMile v3 schema: Part 135 ledger + vertiport slots
-- Apply pass 7 (full backlog implementation): adds consolidated Part 135 records
-- and deterministic vertiport scheduling slots (for conflict detection).

CREATE TABLE IF NOT EXISTS part135_records (
  id              SERIAL PRIMARY KEY,
  record_id       VARCHAR(50) UNIQUE,
  record_type     VARCHAR(40),    -- duty_time | airworthiness | training | medical | checkride
  subject_type    VARCHAR(40),    -- pilot | drone | observer
  subject_id      VARCHAR(50),    -- pilot_id | drone_id | observer_id
  period_start    TIMESTAMPTZ,
  period_end      TIMESTAMPTZ,
  hours_logged    NUMERIC(8,2) DEFAULT 0,
  status          VARCHAR(30) DEFAULT 'open',   -- open | closed | overdue | exempt
  authority       VARCHAR(40),    -- FAA | RCAA | IAA | CAAS | EASA | GCAA
  reference       VARCHAR(200),   -- regulation cite / cert number
  evidence_url    VARCHAR(500),
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_part135_subject
  ON part135_records (subject_type, subject_id, record_type);
CREATE INDEX IF NOT EXISTS idx_part135_status
  ON part135_records (status, period_end);

CREATE TABLE IF NOT EXISTS vertiport_slots (
  id              SERIAL PRIMARY KEY,
  slot_id         VARCHAR(50) UNIQUE,
  vertiport_id    VARCHAR(50),
  pad_index       INTEGER DEFAULT 1,
  mission_id      VARCHAR(50),
  drone_id        VARCHAR(50),
  slot_type       VARCHAR(20) DEFAULT 'arrival',  -- arrival | departure | charging | reserved
  window_start    TIMESTAMPTZ,
  window_end      TIMESTAMPTZ,
  status          VARCHAR(20) DEFAULT 'reserved', -- reserved | confirmed | cancelled | completed
  priority        VARCHAR(20) DEFAULT 'normal',   -- normal | priority | code_red
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_vertiport_slots_vp_window
  ON vertiport_slots (vertiport_id, window_start, window_end);
CREATE INDEX IF NOT EXISTS idx_vertiport_slots_status
  ON vertiport_slots (status);
