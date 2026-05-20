-- AIDroneDeliveryLastMile schema (Part 135 BVLOS drone delivery ops)

CREATE TABLE IF NOT EXISTS drones (
  id                  SERIAL PRIMARY KEY,
  drone_id            VARCHAR(50) UNIQUE,
  model               VARCHAR(120),
  sn                  VARCHAR(80),
  battery_count       INTEGER DEFAULT 0,
  total_flight_hours  NUMERIC(10,2) DEFAULT 0,
  status              VARCHAR(30) DEFAULT 'ready',
  notes               TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS batteries (
  id              SERIAL PRIMARY KEY,
  battery_id      VARCHAR(50) UNIQUE,
  drone_id        VARCHAR(50),
  cycles          INTEGER DEFAULT 0,
  soh_pct         NUMERIC(5,2) DEFAULT 100,
  last_charge     TIMESTAMPTZ,
  status          VARCHAR(30) DEFAULT 'available',
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS flights (
  id              SERIAL PRIMARY KEY,
  flight_id       VARCHAR(50) UNIQUE,
  drone_id        VARCHAR(50),
  mission_id      VARCHAR(50),
  takeoff_at      TIMESTAMPTZ,
  landing_at      TIMESTAMPTZ,
  status          VARCHAR(30) DEFAULT 'scheduled',
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS missions (
  id              SERIAL PRIMARY KEY,
  mission_id      VARCHAR(50) UNIQUE,
  customer_id     VARCHAR(50),
  pickup          VARCHAR(200),
  dropoff         VARCHAR(200),
  payload_kg      NUMERIC(8,3) DEFAULT 0,
  status          VARCHAR(30) DEFAULT 'planning',
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customers (
  id              SERIAL PRIMARY KEY,
  customer_id     VARCHAR(50) UNIQUE,
  name            VARCHAR(150),
  contact         VARCHAR(150),
  type            VARCHAR(60),
  region          VARCHAR(120),
  status          VARCHAR(30) DEFAULT 'active',
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS packages (
  id              SERIAL PRIMARY KEY,
  package_id      VARCHAR(50) UNIQUE,
  mission_id      VARCHAR(50),
  weight_kg       NUMERIC(8,3) DEFAULT 0,
  contents_type   VARCHAR(80),
  destination     VARCHAR(200),
  status          VARCHAR(30) DEFAULT 'pending',
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS depots (
  id              SERIAL PRIMARY KEY,
  depot_id        VARCHAR(50) UNIQUE,
  name            VARCHAR(150),
  location        VARCHAR(200),
  capacity        INTEGER DEFAULT 0,
  status          VARCHAR(30) DEFAULT 'active',
  manager         VARCHAR(150),
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vertiports (
  id              SERIAL PRIMARY KEY,
  vertiport_id    VARCHAR(50) UNIQUE,
  depot_id        VARCHAR(50),
  location        VARCHAR(200),
  pad_count       INTEGER DEFAULT 1,
  status          VARCHAR(30) DEFAULT 'active',
  operator        VARCHAR(150),
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pilots (
  id              SERIAL PRIMARY KEY,
  pilot_id        VARCHAR(50) UNIQUE,
  name            VARCHAR(150),
  license         VARCHAR(80),
  certifications  VARCHAR(300),
  base            VARCHAR(150),
  status          VARCHAR(30) DEFAULT 'active',
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS observers (
  id              SERIAL PRIMARY KEY,
  observer_id     VARCHAR(50) UNIQUE,
  name            VARCHAR(150),
  location        VARCHAR(200),
  certifications  VARCHAR(300),
  status          VARCHAR(30) DEFAULT 'active',
  contact         VARCHAR(150),
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS regulatory_approvals (
  id              SERIAL PRIMARY KEY,
  approval_id     VARCHAR(50) UNIQUE,
  mission_id      VARCHAR(50),
  authority       VARCHAR(120),
  type            VARCHAR(80),
  status          VARCHAR(30) DEFAULT 'pending',
  issued_at       DATE,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS airspace_zones (
  id              SERIAL PRIMARY KEY,
  zone_id         VARCHAR(50) UNIQUE,
  name            VARCHAR(150),
  classification  VARCHAR(60),
  region          VARCHAR(120),
  restrictions    TEXT,
  status          VARCHAR(30) DEFAULT 'active',
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS weather_briefs (
  id              SERIAL PRIMARY KEY,
  brief_id        VARCHAR(50) UNIQUE,
  location        VARCHAR(200),
  valid_at        TIMESTAMPTZ,
  wind_kt         NUMERIC(5,1) DEFAULT 0,
  ceiling_ft      INTEGER DEFAULT 0,
  recommendation  VARCHAR(60),
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS maintenance_logs (
  id              SERIAL PRIMARY KEY,
  log_id          VARCHAR(50) UNIQUE,
  drone_id        VARCHAR(50),
  work            VARCHAR(300),
  technician      VARCHAR(150),
  hours           NUMERIC(6,2) DEFAULT 0,
  completed_at    TIMESTAMPTZ,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS incidents (
  id              SERIAL PRIMARY KEY,
  incident_id     VARCHAR(50) UNIQUE,
  flight_id       VARCHAR(50),
  type            VARCHAR(80),
  severity        VARCHAR(20) DEFAULT 'low',
  opened_at       TIMESTAMPTZ,
  status          VARCHAR(30) DEFAULT 'open',
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS route_corridors (
  id              SERIAL PRIMARY KEY,
  corridor_id     VARCHAR(50) UNIQUE,
  name            VARCHAR(150),
  region          VARCHAR(120),
  start_location  VARCHAR(200),
  end_location    VARCHAR(200),
  status          VARCHAR(30) DEFAULT 'active',
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payload_specs (
  id              SERIAL PRIMARY KEY,
  spec_id         VARCHAR(50) UNIQUE,
  payload_type    VARCHAR(80),
  max_weight_kg   NUMERIC(8,3) DEFAULT 0,
  dimensions      VARCHAR(100),
  hazmat          BOOLEAN DEFAULT FALSE,
  status          VARCHAR(30) DEFAULT 'active',
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_log (
  id              SERIAL PRIMARY KEY,
  entry_id        VARCHAR(50) UNIQUE,
  actor           VARCHAR(150),
  target          VARCHAR(200),
  action          VARCHAR(80),
  result          VARCHAR(40),
  ts              TIMESTAMPTZ DEFAULT NOW(),
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_results (
  id              SERIAL PRIMARY KEY,
  feature         VARCHAR(80) NOT NULL,
  input           JSONB,
  output          JSONB,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ai_results_feature_created
  ON ai_results (feature, created_at DESC);
