ALTER TABLE users ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE users ALTER COLUMN password DROP NOT NULL;

CREATE TABLE IF NOT EXISTS governed_missions (
  id UUID PRIMARY KEY,
  tenant_id VARCHAR(100) NOT NULL,
  external_ref VARCHAR(200) NOT NULL,
  drone_ref VARCHAR(200) NOT NULL,
  route JSONB NOT NULL,
  payload_kg NUMERIC(12,3) NOT NULL,
  max_payload_kg NUMERIC(12,3) NOT NULL,
  planned_energy_wh NUMERIC(14,3) NOT NULL,
  reserve_energy_wh NUMERIC(14,3) NOT NULL,
  safety_snapshot JSONB,
  status VARCHAR(40) NOT NULL DEFAULT 'draft',
  created_by VARCHAR(100) NOT NULL,
  approved_by VARCHAR(100),
  released_by VARCHAR(100),
  outcome JSONB,
  contingency JSONB,
  failure_reason TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, external_ref)
);
CREATE INDEX IF NOT EXISTS governed_missions_tenant_status_idx ON governed_missions (tenant_id, status, updated_at DESC);

CREATE TABLE IF NOT EXISTS governed_mission_telemetry (
  id UUID PRIMARY KEY,
  mission_id UUID NOT NULL REFERENCES governed_missions(id),
  tenant_id VARCHAR(100) NOT NULL,
  sequence_no BIGINT NOT NULL,
  observed_at TIMESTAMPTZ NOT NULL,
  latitude NUMERIC(10,7) NOT NULL,
  longitude NUMERIC(10,7) NOT NULL,
  altitude_m NUMERIC(10,2) NOT NULL,
  battery_percent NUMERIC(5,2) NOT NULL,
  communications_status VARCHAR(40) NOT NULL,
  source VARCHAR(200) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (mission_id, sequence_no)
);

CREATE TABLE IF NOT EXISTS governed_mission_audit (
  id BIGSERIAL PRIMARY KEY,
  mission_id UUID NOT NULL REFERENCES governed_missions(id),
  tenant_id VARCHAR(100) NOT NULL,
  actor_id VARCHAR(100) NOT NULL,
  actor_role VARCHAR(40) NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  from_status VARCHAR(40),
  to_status VARCHAR(40),
  detail JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE OR REPLACE FUNCTION prevent_governed_mission_audit_change() RETURNS trigger AS $$
BEGIN RAISE EXCEPTION 'governed_mission_audit is append-only'; END; $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS governed_mission_audit_immutable ON governed_mission_audit;
CREATE TRIGGER governed_mission_audit_immutable BEFORE UPDATE OR DELETE ON governed_mission_audit
FOR EACH ROW EXECUTE FUNCTION prevent_governed_mission_audit_change();
