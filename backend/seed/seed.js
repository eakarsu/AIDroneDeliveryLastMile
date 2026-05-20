const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'drone_delivery',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function run() {
  const client = await pool.connect();
  try {
    console.log('[seed] resetting tables...');
    await client.query(`
      DROP TABLE IF EXISTS drones                CASCADE;
      DROP TABLE IF EXISTS batteries             CASCADE;
      DROP TABLE IF EXISTS flights               CASCADE;
      DROP TABLE IF EXISTS missions              CASCADE;
      DROP TABLE IF EXISTS customers             CASCADE;
      DROP TABLE IF EXISTS packages              CASCADE;
      DROP TABLE IF EXISTS depots                CASCADE;
      DROP TABLE IF EXISTS vertiports            CASCADE;
      DROP TABLE IF EXISTS pilots                CASCADE;
      DROP TABLE IF EXISTS observers             CASCADE;
      DROP TABLE IF EXISTS regulatory_approvals  CASCADE;
      DROP TABLE IF EXISTS airspace_zones        CASCADE;
      DROP TABLE IF EXISTS weather_briefs        CASCADE;
      DROP TABLE IF EXISTS maintenance_logs      CASCADE;
      DROP TABLE IF EXISTS incidents             CASCADE;
      DROP TABLE IF EXISTS route_corridors       CASCADE;
      DROP TABLE IF EXISTS payload_specs         CASCADE;
      DROP TABLE IF EXISTS audit_log             CASCADE;
      DROP TABLE IF EXISTS ai_results            CASCADE;

      DROP TABLE IF EXISTS users                 CASCADE;
      DROP TABLE IF EXISTS notifications         CASCADE;
      DROP TABLE IF EXISTS attachments           CASCADE;
      DROP TABLE IF EXISTS webhooks              CASCADE;
      DROP TABLE IF EXISTS webhook_deliveries    CASCADE;
    `);

    console.log('[seed] applying migrations...');
    const schema1 = fs.readFileSync(path.join(__dirname, '..', 'migrations', '001_schema.sql'), 'utf8');
    await client.query(schema1);
    const schema2 = fs.readFileSync(path.join(__dirname, '..', 'migrations', '002_schema.sql'), 'utf8');
    await client.query(schema2);

    console.log('[seed] inserting drones...');
    const drones = [
      ['DRN-001', 'Zipline P2 Zip',           'ZP2-001', 4, 540.2,  'ready'],
      ['DRN-002', 'Wing Hummingbird',         'WH-014',  3, 312.8,  'ready'],
      ['DRN-003', 'Matternet M2',             'M2-027',  3, 890.5,  'in_flight'],
      ['DRN-004', 'Manna Mavericks Mk3',      'MM3-009', 4, 215.0,  'maintenance'],
      ['DRN-005', 'DroneUp DR-X',             'DRX-031', 3, 412.3,  'ready'],
      ['DRN-006', 'Flytrex Aviator 3',        'FA3-005', 4, 678.1,  'in_flight'],
      ['DRN-007', 'Zipline P1 Zip',           'ZP1-112', 4, 1245.8, 'ready'],
      ['DRN-008', 'Wing Mk2',                 'WM2-088', 3, 56.4,   'maintenance'],
      ['DRN-009', 'Skyports CarrierBot',      'SCB-019', 5, 778.2,  'ready'],
      ['DRN-010', 'Volansi VOLY M20',         'VM20-04', 6, 1820.5, 'in_flight'],
      ['DRN-011', 'Matternet M2 (HazMat)',    'M2-219',  3, 102.0,  'offline'],
      ['DRN-012', 'Zipline P2 Zip',           'ZP2-088', 4, 401.0,  'ready'],
      ['DRN-013', 'Wing Hummingbird',         'WH-441',  3, 35.8,   'ready'],
      ['DRN-014', 'Manna Mavericks Mk3',      'MM3-022', 4, 0,      'offline'],
      ['DRN-015', 'Flytrex Aviator 3',        'FA3-022', 4, 215.5,  'ready'],
    ];
    for (const d of drones) {
      await client.query(
        `INSERT INTO drones (drone_id,model,sn,battery_count,total_flight_hours,status) VALUES ($1,$2,$3,$4,$5,$6)`,
        d
      );
    }

    console.log('[seed] inserting batteries...');
    const batteries = [
      ['BAT-0001', 'DRN-001',  142, 92.4, '2026-05-16 06:00+00', 'available'],
      ['BAT-0002', 'DRN-001',  138, 93.1, '2026-05-16 05:30+00', 'in_use'],
      ['BAT-0003', 'DRN-002',  201, 88.0, '2026-05-15 22:10+00', 'available'],
      ['BAT-0004', 'DRN-003',  76,  97.2, '2026-05-16 04:15+00', 'in_use'],
      ['BAT-0005', 'DRN-003',  78,  96.5, '2026-05-16 03:00+00', 'charging'],
      ['BAT-0006', 'DRN-004',  445, 71.8, '2026-05-12 18:00+00', 'retired'],
      ['BAT-0007', 'DRN-005',  112, 91.0, '2026-05-15 19:45+00', 'available'],
      ['BAT-0008', 'DRN-006',  198, 86.4, '2026-05-16 07:20+00', 'in_use'],
      ['BAT-0009', 'DRN-007',  380, 78.1, '2026-05-15 21:00+00', 'available'],
      ['BAT-0010', 'DRN-008',  20,  99.5, '2026-05-14 12:00+00', 'maintenance'],
      ['BAT-0011', 'DRN-009',  255, 84.2, '2026-05-16 02:30+00', 'charging'],
      ['BAT-0012', 'DRN-010',  502, 68.7, '2026-05-13 10:00+00', 'retired'],
      ['BAT-0013', 'DRN-012',  88,  94.8, '2026-05-16 06:45+00', 'available'],
      ['BAT-0014', 'DRN-013',  9,   99.9, '2026-05-15 08:00+00', 'available'],
      ['BAT-0015', 'DRN-015',  64,  95.6, '2026-05-15 23:20+00', 'available'],
    ];
    for (const b of batteries) {
      await client.query(
        `INSERT INTO batteries (battery_id,drone_id,cycles,soh_pct,last_charge,status) VALUES ($1,$2,$3,$4,$5,$6)`,
        b
      );
    }

    console.log('[seed] inserting flights...');
    const flights = [
      ['FLT-2026-0001', 'DRN-003', 'MSN-2026-0001', '2026-05-16 08:00+00', '2026-05-16 08:34+00', 'completed'],
      ['FLT-2026-0002', 'DRN-006', 'MSN-2026-0002', '2026-05-16 09:15+00', null,                 'in_flight'],
      ['FLT-2026-0003', 'DRN-010', 'MSN-2026-0003', '2026-05-16 07:30+00', null,                 'in_flight'],
      ['FLT-2026-0004', 'DRN-001', 'MSN-2026-0004', '2026-05-16 10:45+00', null,                 'scheduled'],
      ['FLT-2026-0005', 'DRN-002', 'MSN-2026-0005', '2026-05-16 11:00+00', null,                 'scheduled'],
      ['FLT-2026-0006', 'DRN-007', 'MSN-2026-0006', '2026-05-16 06:00+00', '2026-05-16 06:42+00', 'completed'],
      ['FLT-2026-0007', 'DRN-005', 'MSN-2026-0007', '2026-05-16 12:30+00', null,                 'scheduled'],
      ['FLT-2026-0008', 'DRN-009', 'MSN-2026-0008', '2026-05-16 13:15+00', null,                 'scheduled'],
      ['FLT-2026-0009', 'DRN-012', 'MSN-2026-0009', '2026-05-15 17:00+00', '2026-05-15 17:25+00', 'completed'],
      ['FLT-2026-0010', 'DRN-015', 'MSN-2026-0010', '2026-05-16 14:00+00', null,                 'scheduled'],
      ['FLT-2026-0011', 'DRN-013', 'MSN-2026-0011', '2026-05-15 09:00+00', '2026-05-15 09:18+00', 'completed'],
      ['FLT-2026-0012', 'DRN-003', 'MSN-2026-0012', '2026-05-15 14:30+00', null,                 'aborted'],
      ['FLT-2026-0013', 'DRN-001', 'MSN-2026-0013', '2026-05-16 15:00+00', null,                 'scheduled'],
      ['FLT-2026-0014', 'DRN-006', 'MSN-2026-0014', '2026-05-15 11:00+00', '2026-05-15 11:36+00', 'completed'],
      ['FLT-2026-0015', 'DRN-010', 'MSN-2026-0015', '2026-05-16 16:00+00', null,                 'scheduled'],
    ];
    for (const f of flights) {
      await client.query(
        `INSERT INTO flights (flight_id,drone_id,mission_id,takeoff_at,landing_at,status) VALUES ($1,$2,$3,$4,$5,$6)`,
        f
      );
    }

    console.log('[seed] inserting missions...');
    const missions = [
      ['MSN-2026-0001', 'CUS-001', 'Mercy Hospital, Charlotte NC',    '4521 Oak Ridge, Charlotte NC',     1.250, 'completed'],
      ['MSN-2026-0002', 'CUS-002', 'Walmart Store #1804, Dallas TX',  '8919 Whisper Way, Dallas TX',      2.400, 'in_flight'],
      ['MSN-2026-0003', 'CUS-003', 'Kigali Vertiport (Zipline)',      'Muhanga District Hospital, RW',    3.800, 'in_flight'],
      ['MSN-2026-0004', 'CUS-004', 'CVS #4488, Logan UT',             '221 Aspen Hills, Logan UT',        0.450, 'scheduled'],
      ['MSN-2026-0005', 'CUS-005', 'DroneUp Hub, Bentonville AR',     '1187 Pinecrest Ln, Bentonville',   1.800, 'scheduled'],
      ['MSN-2026-0006', 'CUS-006', 'St. Vincent Hospital, Dublin IE', 'Manna Hub, Lusk IE',               0.900, 'completed'],
      ['MSN-2026-0007', 'CUS-007', 'Wing Operations, Logan UT',       'Frederick Field House, Logan UT',  1.100, 'scheduled'],
      ['MSN-2026-0008', 'CUS-008', 'Skyports Hub, Singapore',         'Singapore General Hospital',       2.000, 'scheduled'],
      ['MSN-2026-0009', 'CUS-009', 'Zipline Distribution, Ghana',     'Akuapem Hospital, Akropong',       1.500, 'completed'],
      ['MSN-2026-0010', 'CUS-010', 'Flytrex Hub, Granbury TX',        '5520 Lakeview, Granbury TX',       1.200, 'scheduled'],
      ['MSN-2026-0011', 'CUS-001', 'Mercy Hospital, Charlotte NC',    '102 Greenway, Charlotte NC',       0.600, 'completed'],
      ['MSN-2026-0012', 'CUS-003', 'Kigali Vertiport (Zipline)',      'Nyabihu Health Center, RW',        2.100, 'aborted'],
      ['MSN-2026-0013', 'CUS-004', 'CVS #4488, Logan UT',             '88 Hilltop Dr, Logan UT',          0.300, 'scheduled'],
      ['MSN-2026-0014', 'CUS-002', 'Walmart Store #1804, Dallas TX',  '4412 Whisper Way, Dallas TX',      2.800, 'completed'],
      ['MSN-2026-0015', 'CUS-008', 'Skyports Hub, Singapore',         'KK Womens Hospital, Singapore',    1.900, 'scheduled'],
    ];
    for (const m of missions) {
      await client.query(
        `INSERT INTO missions (mission_id,customer_id,pickup,dropoff,payload_kg,status) VALUES ($1,$2,$3,$4,$5,$6)`,
        m
      );
    }

    console.log('[seed] inserting customers...');
    const customers = [
      ['CUS-001', 'Mercy Hospital Network',     'logistics@mercyhealth.org',  'healthcare',  'Carolinas, USA',     'active'],
      ['CUS-002', 'Walmart Inc.',               'drone-ops@walmart.com',      'retail',      'Texas / SE USA',     'active'],
      ['CUS-003', 'Zipline Rwanda',             'rw-ops@flyzipline.com',      'healthcare',  'Rwanda',             'active'],
      ['CUS-004', 'CVS Health',                 'air-rx@cvshealth.com',       'pharmacy',    'Utah / Mountain',    'active'],
      ['CUS-005', 'DroneUp / Walmart',          'ops@droneup.com',            'retail',      'Arkansas',           'active'],
      ['CUS-006', 'Manna Aero Ireland',         'ops@manna.aero',             'food_retail', 'Ireland',            'active'],
      ['CUS-007', 'Wing (Alphabet)',            'ops@wing.com',               'retail',      'Logan UT / Frisco',  'active'],
      ['CUS-008', 'SingHealth Group',           'air-logistics@singhealth.sg','healthcare',  'Singapore',          'active'],
      ['CUS-009', 'Zipline Ghana',              'gh-ops@flyzipline.com',      'healthcare',  'Ghana',              'active'],
      ['CUS-010', 'Flytrex Inc.',               'ops@flytrex.com',            'food_retail', 'Texas',              'active'],
      ['CUS-011', 'Kaiser Permanente',          'air-ops@kp.org',             'healthcare',  'CA / Pacific NW',    'paused'],
      ['CUS-012', 'Domino Pizza Drone Pilot',   'dronepilot@dominos.com',     'food_retail', 'Auckland, NZ',       'paused'],
      ['CUS-013', 'UPS Flight Forward',         'ops@upsflightforward.com',   'logistics',   'North Carolina',     'active'],
      ['CUS-014', 'DHL Express Parcelcopter',   'parcelcopter@dhl.com',       'logistics',   'Germany',            'active'],
      ['CUS-015', 'Matternet Inc.',             'partners@mttr.net',          'healthcare',  'California / NY',    'active'],
    ];
    for (const c of customers) {
      await client.query(
        `INSERT INTO customers (customer_id,name,contact,type,region,status) VALUES ($1,$2,$3,$4,$5,$6)`,
        c
      );
    }

    console.log('[seed] inserting packages...');
    const packages = [
      ['PKG-2026-0001', 'MSN-2026-0001', 1.250, 'blood_product',  '4521 Oak Ridge, Charlotte NC',     'delivered'],
      ['PKG-2026-0002', 'MSN-2026-0002', 2.400, 'retail_grocery', '8919 Whisper Way, Dallas TX',      'in_transit'],
      ['PKG-2026-0003', 'MSN-2026-0003', 3.800, 'medical_supply', 'Muhanga District Hospital, RW',    'in_transit'],
      ['PKG-2026-0004', 'MSN-2026-0004', 0.450, 'pharmacy_rx',    '221 Aspen Hills, Logan UT',        'pending'],
      ['PKG-2026-0005', 'MSN-2026-0005', 1.800, 'retail_general', '1187 Pinecrest Ln, Bentonville',   'pending'],
      ['PKG-2026-0006', 'MSN-2026-0006', 0.900, 'food_hot',       'Manna Hub, Lusk IE',               'delivered'],
      ['PKG-2026-0007', 'MSN-2026-0007', 1.100, 'retail_grocery', 'Frederick Field House, Logan UT',  'pending'],
      ['PKG-2026-0008', 'MSN-2026-0008', 2.000, 'medical_sample', 'Singapore General Hospital',       'pending'],
      ['PKG-2026-0009', 'MSN-2026-0009', 1.500, 'blood_product',  'Akuapem Hospital, Akropong',       'delivered'],
      ['PKG-2026-0010', 'MSN-2026-0010', 1.200, 'food_grocery',   '5520 Lakeview, Granbury TX',       'pending'],
      ['PKG-2026-0011', 'MSN-2026-0011', 0.600, 'pharmacy_rx',    '102 Greenway, Charlotte NC',       'delivered'],
      ['PKG-2026-0012', 'MSN-2026-0012', 2.100, 'medical_supply', 'Nyabihu Health Center, RW',        'returned'],
      ['PKG-2026-0013', 'MSN-2026-0013', 0.300, 'pharmacy_rx',    '88 Hilltop Dr, Logan UT',          'pending'],
      ['PKG-2026-0014', 'MSN-2026-0014', 2.800, 'retail_grocery', '4412 Whisper Way, Dallas TX',      'delivered'],
      ['PKG-2026-0015', 'MSN-2026-0015', 1.900, 'medical_sample', 'KK Womens Hospital, Singapore',    'pending'],
    ];
    for (const p of packages) {
      await client.query(
        `INSERT INTO packages (package_id,mission_id,weight_kg,contents_type,destination,status) VALUES ($1,$2,$3,$4,$5,$6)`,
        p
      );
    }

    console.log('[seed] inserting depots...');
    const depots = [
      ['DEP-001', 'Charlotte Air Hub',          'Charlotte-Douglas Intl Area, NC',  120, 'active',     'Sarah Chen'],
      ['DEP-002', 'Dallas Metro Hub',           'Frisco TX',                        180, 'active',     'Marcus Lee'],
      ['DEP-003', 'Kigali Distribution Center', 'Muhanga, Rwanda',                  90,  'active',     'Eric Mugisha'],
      ['DEP-004', 'Logan UT Hub',               'Logan UT',                          60, 'active',     'Lindsey Park'],
      ['DEP-005', 'Bentonville Walmart Hub',    'Bentonville AR',                   140, 'active',     'Devin Patterson'],
      ['DEP-006', 'Dublin Manna Hub',           'Lusk, Ireland',                     50, 'active',     'Aine O Briain'],
      ['DEP-007', 'Singapore Vertihub',         'Loyang Singapore',                 100, 'active',     'Wei Tan'],
      ['DEP-008', 'Akropong Distribution',      'Akuapem, Ghana',                    70, 'active',     'Kojo Mensah'],
      ['DEP-009', 'Granbury TX Hub',            'Granbury TX',                       40, 'active',     'Megan Doyle'],
      ['DEP-010', 'Frederick Hub (Wing)',       'Frederick CO',                      80, 'active',     'Olivia Brooks'],
      ['DEP-011', 'Phoenix Reserve Hub',        'Phoenix AZ',                       110, 'maintenance','Carlos Ramirez'],
      ['DEP-012', 'Seattle UPS-FF Hub',         'Tacoma WA',                         95, 'active',     'Hannah Liu'],
      ['DEP-013', 'Frankfurt DHL Hub',          'Frankfurt am Main, DE',            130, 'active',     'Stefan Weber'],
      ['DEP-014', 'Bay Area Matternet Hub',     'Hayward CA',                        85, 'active',     'Priya Anand'],
      ['DEP-015', 'Raleigh Reserve Hub',        'Raleigh NC',                        55, 'offline',    'Trevor Lyons'],
    ];
    for (const d of depots) {
      await client.query(
        `INSERT INTO depots (depot_id,name,location,capacity,status,manager) VALUES ($1,$2,$3,$4,$5,$6)`,
        d
      );
    }

    console.log('[seed] inserting vertiports...');
    const vertiports = [
      ['VPT-001', 'DEP-001', 'Charlotte Air Hub, NC',       4, 'active',     'AirDelivery LLC'],
      ['VPT-002', 'DEP-002', 'Frisco TX (rooftop)',         3, 'active',     'Walmart Drone Services'],
      ['VPT-003', 'DEP-003', 'Muhanga Pad, RW',             6, 'active',     'Zipline Rwanda'],
      ['VPT-004', 'DEP-004', 'Logan UT Hub',                2, 'active',     'Wing LLC'],
      ['VPT-005', 'DEP-005', 'Bentonville DroneUp Pad',     4, 'active',     'DroneUp LLC'],
      ['VPT-006', 'DEP-006', 'Manna Lusk IE',               3, 'active',     'Manna Aero'],
      ['VPT-007', 'DEP-007', 'Loyang Vertihub SG',          5, 'active',     'Skyports Pte Ltd'],
      ['VPT-008', 'DEP-008', 'Akuapem Pad, GH',             4, 'active',     'Zipline Ghana'],
      ['VPT-009', 'DEP-009', 'Granbury Pad, TX',            2, 'active',     'Flytrex Inc.'],
      ['VPT-010', 'DEP-010', 'Frederick Field, CO',         3, 'active',     'Wing LLC'],
      ['VPT-011', 'DEP-011', 'Phoenix Reserve Pad',         3, 'maintenance','AirDelivery LLC'],
      ['VPT-012', 'DEP-012', 'Tacoma UPS-FF Pad',           4, 'active',     'UPS Flight Forward'],
      ['VPT-013', 'DEP-013', 'Frankfurt DHL Pad',           5, 'active',     'DHL Parcelcopter Ops'],
      ['VPT-014', 'DEP-014', 'Hayward CA Matternet Pad',    3, 'active',     'Matternet Inc.'],
      ['VPT-015', 'DEP-015', 'Raleigh Reserve Pad',         2, 'offline',    'AirDelivery LLC'],
    ];
    for (const v of vertiports) {
      await client.query(
        `INSERT INTO vertiports (vertiport_id,depot_id,location,pad_count,status,operator) VALUES ($1,$2,$3,$4,$5,$6)`,
        v
      );
    }

    console.log('[seed] inserting pilots...');
    const pilots = [
      ['PLT-001', 'Maya Reynolds',     'Part 107 + 135',  'BVLOS waiver, multi-engine sUAS', 'Charlotte Hub',   'active'],
      ['PLT-002', 'Daniel Ortiz',      'Part 107 + 135',  'BVLOS waiver',                    'Dallas Hub',      'active'],
      ['PLT-003', 'Aline Uwase',       'RW-CAA Pilot',    'BVLOS, medical-cargo endorsement','Kigali Hub',      'on_shift'],
      ['PLT-004', 'Emma Caldwell',     'Part 107',        'VLOS only',                        'Logan UT Hub',    'active'],
      ['PLT-005', 'Jordan Hayes',      'Part 107 + 135',  'BVLOS waiver, multi-aircraft',     'Bentonville Hub', 'on_shift'],
      ['PLT-006', 'Sean O Driscoll',   'EASA Class B',    'BVLOS, food delivery cat',         'Dublin Hub',      'active'],
      ['PLT-007', 'Wei-Ling Tan',      'CAAS UA Pilot',   'BVLOS, hospital-cargo endorsement','Singapore Hub',   'active'],
      ['PLT-008', 'Kwame Asante',      'GCAA UA Pilot',   'BVLOS, medical-cargo endorsement', 'Akropong Hub',    'on_shift'],
      ['PLT-009', 'Riley Brennan',     'Part 107 + 135',  'BVLOS waiver',                     'Granbury Hub',    'active'],
      ['PLT-010', 'Owen Marsh',        'Part 107 + 135',  'BVLOS waiver, low-light ops',      'Frederick Hub',   'leave'],
      ['PLT-011', 'Tara Singh',        'Part 107',        'VLOS only, training',              'Phoenix Hub',     'training'],
      ['PLT-012', 'Hannah Liu',        'Part 107 + 135',  'BVLOS waiver, parcel-cargo',       'Tacoma Hub',      'active'],
      ['PLT-013', 'Stefan Wegener',    'LBA Class B',     'BVLOS, parcel-cargo',              'Frankfurt Hub',   'active'],
      ['PLT-014', 'Priya Anand',       'Part 107 + 135',  'BVLOS waiver, medical-cargo',      'Hayward Hub',     'active'],
      ['PLT-015', 'Trevor Lyons',      'Part 107',        'VLOS only',                        'Raleigh Hub',     'inactive'],
    ];
    for (const p of pilots) {
      await client.query(
        `INSERT INTO pilots (pilot_id,name,license,certifications,base,status) VALUES ($1,$2,$3,$4,$5,$6)`,
        p
      );
    }

    console.log('[seed] inserting observers...');
    const observers = [
      ['OBS-001', 'Tomas Reyes',       'Mile-2 corridor, Charlotte NC',     'Visual Observer cert, radio op',  'active',    '+1 704 555 0188'],
      ['OBS-002', 'Jenna McAllister',  'Mile-5 corridor, Dallas TX',        'Visual Observer cert',             'on_shift',  '+1 214 555 0177'],
      ['OBS-003', 'Innocent Habimana', 'Muhanga corridor, RW',              'CAA-RW VO',                        'on_shift',  '+250 78 555 0211'],
      ['OBS-004', 'Carrie Beckett',    'Logan UT pad approach',              'Visual Observer cert',            'active',    '+1 435 555 0140'],
      ['OBS-005', 'Brett Whitman',     'Bentonville rooftop sector',         'Visual Observer cert, radio op',  'active',    '+1 479 555 0166'],
      ['OBS-006', 'Aoife Murphy',      'Lusk corridor IE',                   'IAA VO',                          'on_shift',  '+353 1 555 0223'],
      ['OBS-007', 'Jia Tan',           'Loyang corridor SG',                 'CAAS VO',                         'active',    '+65 6555 0190'],
      ['OBS-008', 'Yaw Boateng',       'Akropong corridor GH',                'GCAA VO',                        'on_shift',  '+233 24 555 0202'],
      ['OBS-009', 'Beth Lawler',       'Granbury corridor TX',                'Visual Observer cert',           'active',    '+1 817 555 0181'],
      ['OBS-010', 'Marcus Hall',       'Frederick CO sector',                 'Visual Observer cert',           'leave',     '+1 720 555 0193'],
      ['OBS-011', 'Lena Park',         'Phoenix pad approach',                'Visual Observer cert',           'inactive',  '+1 480 555 0157'],
      ['OBS-012', 'Aaron Cole',        'Tacoma WA corridor',                  'Visual Observer cert',           'active',    '+1 253 555 0148'],
      ['OBS-013', 'Lukas Schmidt',     'Frankfurt corridor DE',               'LBA VO',                         'active',    '+49 69 555 0234'],
      ['OBS-014', 'Suresh Iyer',       'Hayward CA pad',                       'Visual Observer cert',          'active',    '+1 510 555 0162'],
      ['OBS-015', 'Reese Kennedy',     'Raleigh reserve pad',                  'Visual Observer cert (lapsed)', 'inactive',  '+1 919 555 0175'],
    ];
    for (const o of observers) {
      await client.query(
        `INSERT INTO observers (observer_id,name,location,certifications,status,contact) VALUES ($1,$2,$3,$4,$5,$6)`,
        o
      );
    }

    console.log('[seed] inserting regulatory_approvals...');
    const approvals = [
      ['REG-2026-0001', 'MSN-2026-0001', 'FAA',  'Part 135 single-pilot OpSpec', 'approved', '2026-01-15'],
      ['REG-2026-0002', 'MSN-2026-0002', 'FAA',  'BVLOS waiver 44807',           'approved', '2026-02-04'],
      ['REG-2026-0003', 'MSN-2026-0003', 'RCAA', 'Medical Cargo Authorization',  'approved', '2025-11-20'],
      ['REG-2026-0004', 'MSN-2026-0004', 'FAA',  'Part 135 OpSpec amendment',    'approved', '2026-03-09'],
      ['REG-2026-0005', 'MSN-2026-0005', 'FAA',  'BVLOS waiver 44807',           'approved', '2026-02-18'],
      ['REG-2026-0006', 'MSN-2026-0006', 'IAA',  'BVLOS Specific Cat',           'approved', '2025-12-10'],
      ['REG-2026-0007', 'MSN-2026-0007', 'FAA',  'BVLOS waiver 44807',           'pending',  null],
      ['REG-2026-0008', 'MSN-2026-0008', 'CAAS', 'UA Operator Permit',           'approved', '2026-01-30'],
      ['REG-2026-0009', 'MSN-2026-0009', 'GCAA', 'Medical UAS authorization',    'approved', '2025-10-22'],
      ['REG-2026-0010', 'MSN-2026-0010', 'FAA',  'Part 135 OpSpec amendment',    'approved', '2026-03-25'],
      ['REG-2026-0011', 'MSN-2026-0011', 'FAA',  'Part 135 single-pilot OpSpec', 'approved', '2026-01-15'],
      ['REG-2026-0012', 'MSN-2026-0012', 'RCAA', 'Medical Cargo Authorization',  'suspended','2026-04-18'],
      ['REG-2026-0013', 'MSN-2026-0013', 'FAA',  'Part 135 OpSpec amendment',    'pending',  null],
      ['REG-2026-0014', 'MSN-2026-0014', 'FAA',  'BVLOS waiver 44807',           'approved', '2026-02-04'],
      ['REG-2026-0015', 'MSN-2026-0015', 'CAAS', 'UA Operator Permit',           'approved', '2026-01-30'],
    ];
    for (const r of approvals) {
      await client.query(
        `INSERT INTO regulatory_approvals (approval_id,mission_id,authority,type,status,issued_at) VALUES ($1,$2,$3,$4,$5,$6)`,
        r
      );
    }

    console.log('[seed] inserting airspace_zones...');
    const zones = [
      ['ASZ-001', 'KCLT Mode-C Veil',             'Class B',     'Charlotte NC',     'No transit without ATC clearance', 'active'],
      ['ASZ-002', 'KDAL surface area',            'Class B',     'Dallas TX',         'BVLOS corridor approved 7-15 LT',  'active'],
      ['ASZ-003', 'Kigali HKIA TMA',              'Class C',     'Kigali RW',         'Pre-coordinated transit only',     'active'],
      ['ASZ-004', 'KLGU Class D',                 'Class D',     'Logan UT',          'Two-way comm required',            'active'],
      ['ASZ-005', 'Bentonville XNA TMA',          'Class C',     'NW Arkansas',       'Pre-coordinated transit',          'active'],
      ['ASZ-006', 'EIDW CTR',                     'Class C',     'Dublin IE',         'Pre-coordinated transit',          'active'],
      ['ASZ-007', 'Singapore CTR',                'Class C/D',   'Singapore',         'CAAS deconfliction required',      'active'],
      ['ASZ-008', 'DGAA TMA',                     'Class C',     'Accra GH',          'Pre-coordinated transit',          'active'],
      ['ASZ-009', 'Granbury Class G',             'Class G',     'Granbury TX',       'Sub-400 ft AGL',                   'active'],
      ['ASZ-010', 'Frederick Class E',            'Class E',     'Frederick CO',      'See & avoid + ADS-B in/out',       'active'],
      ['ASZ-011', 'Phoenix TFR (wildfire)',       'TFR',          'Phoenix AZ',       'No drone ops while active',         'restricted'],
      ['ASZ-012', 'Tacoma KSEA Mode-C Veil',      'Class B',     'Tacoma WA',         'No transit without ATC clearance', 'active'],
      ['ASZ-013', 'EDDF CTR',                     'Class C',     'Frankfurt DE',      'DFS deconfliction required',       'active'],
      ['ASZ-014', 'KSFO Mode-C Veil',             'Class B',     'Bay Area CA',       'No transit without ATC clearance', 'active'],
      ['ASZ-015', 'KRDU Class C',                 'Class C',     'Raleigh NC',        'Pre-coordinated transit',          'active'],
    ];
    for (const z of zones) {
      await client.query(
        `INSERT INTO airspace_zones (zone_id,name,classification,region,restrictions,status) VALUES ($1,$2,$3,$4,$5,$6)`,
        z
      );
    }

    console.log('[seed] inserting weather_briefs...');
    const weather = [
      ['WX-2026-0001', 'Charlotte NC',     '2026-05-16 12:00+00',  8.2, 3500, 'go'],
      ['WX-2026-0002', 'Dallas TX',        '2026-05-16 12:00+00', 14.1, 4500, 'go'],
      ['WX-2026-0003', 'Kigali RW',        '2026-05-16 12:00+00',  6.5, 2800, 'caution'],
      ['WX-2026-0004', 'Logan UT',         '2026-05-16 12:00+00', 10.8, 5200, 'go'],
      ['WX-2026-0005', 'Bentonville AR',   '2026-05-16 12:00+00', 12.5, 4100, 'go'],
      ['WX-2026-0006', 'Dublin IE',        '2026-05-16 12:00+00', 18.7, 1500, 'caution'],
      ['WX-2026-0007', 'Singapore',        '2026-05-16 12:00+00',  7.2, 2200, 'caution'],
      ['WX-2026-0008', 'Accra GH',         '2026-05-16 12:00+00',  9.1, 3000, 'go'],
      ['WX-2026-0009', 'Granbury TX',      '2026-05-16 12:00+00', 11.0, 4400, 'go'],
      ['WX-2026-0010', 'Frederick CO',     '2026-05-16 12:00+00', 22.3,  800, 'no_go'],
      ['WX-2026-0011', 'Phoenix AZ',       '2026-05-16 12:00+00', 16.8, 5500, 'caution'],
      ['WX-2026-0012', 'Tacoma WA',        '2026-05-16 12:00+00', 13.4, 1800, 'caution'],
      ['WX-2026-0013', 'Frankfurt DE',     '2026-05-16 12:00+00', 15.6, 2500, 'caution'],
      ['WX-2026-0014', 'Hayward CA',       '2026-05-16 12:00+00',  8.9, 4200, 'go'],
      ['WX-2026-0015', 'Raleigh NC',       '2026-05-16 12:00+00', 25.1,  600, 'no_go'],
    ];
    for (const w of weather) {
      await client.query(
        `INSERT INTO weather_briefs (brief_id,location,valid_at,wind_kt,ceiling_ft,recommendation) VALUES ($1,$2,$3,$4,$5,$6)`,
        w
      );
    }

    console.log('[seed] inserting maintenance_logs...');
    const maint = [
      ['MNT-2026-0001', 'DRN-001', '50-hr inspection + prop swap',           'Maya Reynolds',    2.5, '2026-05-10 14:00+00'],
      ['MNT-2026-0002', 'DRN-002', 'Battery cycle re-baseline',              'Daniel Ortiz',     1.0, '2026-05-12 10:00+00'],
      ['MNT-2026-0003', 'DRN-003', '100-hr motor-bearing replacement',       'Aline Uwase',      4.8, '2026-05-11 09:00+00'],
      ['MNT-2026-0004', 'DRN-004', 'Airframe AD compliance (SB-2025-04)',    'Owen Marsh',       6.2, '2026-05-13 08:00+00'],
      ['MNT-2026-0005', 'DRN-005', 'Parachute pyrotechnic inspection',       'Jordan Hayes',     1.5, '2026-05-14 11:00+00'],
      ['MNT-2026-0006', 'DRN-006', '50-hr inspection',                       'Sean O Driscoll',  2.5, '2026-05-09 16:00+00'],
      ['MNT-2026-0007', 'DRN-007', 'Tail-fin replacement after bird strike', 'Maya Reynolds',    3.0, '2026-05-08 13:00+00'],
      ['MNT-2026-0008', 'DRN-008', '300-hr full teardown',                   'Owen Marsh',      12.0, '2026-05-12 09:00+00'],
      ['MNT-2026-0009', 'DRN-009', '100-hr inspection',                      'Wei-Ling Tan',     4.5, '2026-05-10 10:00+00'],
      ['MNT-2026-0010', 'DRN-010', 'Comms link tuning + ADS-B firmware',     'Stefan Wegener',   2.0, '2026-05-13 14:00+00'],
      ['MNT-2026-0011', 'DRN-011', 'HazMat pod re-cert',                     'Priya Anand',      3.5, '2026-05-14 15:00+00'],
      ['MNT-2026-0012', 'DRN-012', 'Propeller balance',                      'Maya Reynolds',    0.8, '2026-05-15 09:30+00'],
      ['MNT-2026-0013', 'DRN-013', 'Pre-acceptance flight test',             'Daniel Ortiz',     1.2, '2026-05-11 12:00+00'],
      ['MNT-2026-0014', 'DRN-014', 'Avionics LRU swap',                      'Jordan Hayes',     2.7, '2026-05-12 11:00+00'],
      ['MNT-2026-0015', 'DRN-015', '50-hr inspection',                       'Riley Brennan',    2.5, '2026-05-15 13:00+00'],
    ];
    for (const m of maint) {
      await client.query(
        `INSERT INTO maintenance_logs (log_id,drone_id,work,technician,hours,completed_at) VALUES ($1,$2,$3,$4,$5,$6)`,
        m
      );
    }

    console.log('[seed] inserting incidents...');
    const incidents = [
      ['INC-2026-0001', 'FLT-2026-0012', 'GPS_loss',          'medium',   '2026-05-15 14:42+00', 'closed'],
      ['INC-2026-0002', 'FLT-2026-0006', 'low_battery_RTH',   'low',      '2026-05-16 06:35+00', 'closed'],
      ['INC-2026-0003', 'FLT-2026-0003', 'C2_link_dropout',   'high',     '2026-05-16 07:48+00', 'investigating'],
      ['INC-2026-0004', 'FLT-2026-0014', 'rough_landing',     'low',      '2026-05-15 11:36+00', 'closed'],
      ['INC-2026-0005', 'FLT-2026-0002', 'wind_advisory',     'low',      '2026-05-16 09:22+00', 'open'],
      ['INC-2026-0006', 'FLT-2026-0001', 'bird_strike',       'medium',   '2026-05-16 08:18+00', 'closed'],
      ['INC-2026-0007', 'FLT-2026-0009', 'airspace_intrusion','high',     '2026-05-15 17:10+00', 'closed'],
      ['INC-2026-0008', 'FLT-2026-0011', 'parachute_misfire', 'critical', '2026-05-15 09:14+00', 'closed'],
      ['INC-2026-0009', 'FLT-2026-0007', 'precip_abort',      'low',      '2026-05-16 12:35+00', 'investigating'],
      ['INC-2026-0010', 'FLT-2026-0008', 'TFR_conflict',      'high',     '2026-05-16 13:18+00', 'open'],
      ['INC-2026-0011', 'FLT-2026-0010', 'payload_release_fail','medium', '2026-05-16 14:25+00', 'open'],
      ['INC-2026-0012', 'FLT-2026-0013', 'comm_jam_suspect',  'medium',   '2026-05-16 15:18+00', 'open'],
      ['INC-2026-0013', 'FLT-2026-0015', 'reroute_traffic',   'low',      '2026-05-16 16:09+00', 'investigating'],
      ['INC-2026-0014', 'FLT-2026-0004', 'pre-flight_warn',   'low',      '2026-05-16 10:30+00', 'open'],
      ['INC-2026-0015', 'FLT-2026-0005', 'wx_deferred',       'low',      '2026-05-16 10:50+00', 'open'],
    ];
    for (const i of incidents) {
      await client.query(
        `INSERT INTO incidents (incident_id,flight_id,type,severity,opened_at,status) VALUES ($1,$2,$3,$4,$5,$6)`,
        i
      );
    }

    console.log('[seed] inserting route_corridors...');
    const corridors = [
      ['COR-001', 'Charlotte Mile-2 Med Corridor',  'Charlotte NC',     'Mercy Hospital, Charlotte NC',     'Oak Ridge sector, Charlotte NC',   'active'],
      ['COR-002', 'Dallas Frisco Retail Corridor',  'Dallas TX',        'Walmart Store #1804, Dallas TX',   'Whisper Way sector, Dallas TX',    'active'],
      ['COR-003', 'Muhanga Hospital Corridor',      'Muhanga RW',       'Kigali Vertiport',                 'Muhanga District Hospital, RW',    'active'],
      ['COR-004', 'Logan UT Pharmacy Corridor',     'Logan UT',         'CVS #4488, Logan UT',              'Aspen Hills sector, Logan UT',     'active'],
      ['COR-005', 'Bentonville Retail Corridor',    'Bentonville AR',   'DroneUp Hub, Bentonville',         'Pinecrest sector, Bentonville',    'active'],
      ['COR-006', 'Dublin North Food Corridor',     'Dublin IE',        'Manna Hub, Lusk IE',                'St Vincent Hospital, Dublin',      'active'],
      ['COR-007', 'Singapore Hospital Corridor',    'Singapore',        'Skyports Hub, Loyang',             'Singapore General Hospital',       'active'],
      ['COR-008', 'Akropong Medical Corridor',      'Akropong GH',      'Zipline Distribution, Ghana',      'Akuapem Hospital, Akropong',       'active'],
      ['COR-009', 'Granbury Lakeview Corridor',     'Granbury TX',      'Flytrex Hub, Granbury',            'Lakeview sector, Granbury',        'active'],
      ['COR-010', 'Frederick Field Corridor',       'Frederick CO',     'Wing Frederick Hub',                'Frederick Field House',           'active'],
      ['COR-011', 'Phoenix Reserve Corridor',       'Phoenix AZ',       'Phoenix Reserve Hub',               'Glendale sector, Phoenix AZ',      'suspended'],
      ['COR-012', 'Tacoma Parcel Corridor',         'Tacoma WA',        'Seattle UPS-FF Hub',                'Spanaway sector, Tacoma WA',       'active'],
      ['COR-013', 'Frankfurt Parcel Corridor',      'Frankfurt DE',     'Frankfurt DHL Hub',                 'Bad Homburg sector, DE',           'active'],
      ['COR-014', 'Hayward Hospital Corridor',      'Bay Area CA',      'Matternet Hayward Hub',             'Eden Medical Center, CA',          'active'],
      ['COR-015', 'Raleigh Reserve Corridor',       'Raleigh NC',       'Raleigh Reserve Hub',               'Cary sector, NC',                   'suspended'],
    ];
    for (const c of corridors) {
      await client.query(
        `INSERT INTO route_corridors (corridor_id,name,region,start_location,end_location,status) VALUES ($1,$2,$3,$4,$5,$6)`,
        c
      );
    }

    console.log('[seed] inserting payload_specs...');
    const specs = [
      ['PSP-001', 'blood_product',     1.500, '20x15x10 cm insulated', false, 'active'],
      ['PSP-002', 'pharmacy_rx',       0.500, '15x10x5 cm',            false, 'active'],
      ['PSP-003', 'retail_grocery',    2.500, '30x25x20 cm',           false, 'active'],
      ['PSP-004', 'food_hot',          1.200, '25x25x15 cm insulated', false, 'active'],
      ['PSP-005', 'medical_supply',    4.000, '35x30x25 cm',           false, 'active'],
      ['PSP-006', 'medical_sample',    1.000, '20x15x10 cm cold-chain',false, 'active'],
      ['PSP-007', 'lithium_battery',   0.800, '15x10x10 cm UN3480',    true,  'active'],
      ['PSP-008', 'biological_waste',  1.500, '25x20x15 cm UN3291',    true,  'restricted'],
      ['PSP-009', 'oxygen_cylinder',   2.000, '40x10x10 cm UN1072',    true,  'restricted'],
      ['PSP-010', 'general_parcel',    2.000, '30x20x15 cm',           false, 'active'],
      ['PSP-011', 'documents',         0.300, '30x22x2 cm',            false, 'active'],
      ['PSP-012', 'food_cold',         1.800, '25x20x15 cm cold',      false, 'active'],
      ['PSP-013', 'vaccine_vials',     1.000, '20x15x10 cm cold-chain',false, 'active'],
      ['PSP-014', 'large_parcel',      4.500, '40x35x30 cm',           false, 'restricted'],
      ['PSP-015', 'aed_defib',         3.500, '40x30x10 cm',           false, 'active'],
    ];
    for (const s of specs) {
      await client.query(
        `INSERT INTO payload_specs (spec_id,payload_type,max_weight_kg,dimensions,hazmat,status) VALUES ($1,$2,$3,$4,$5,$6)`,
        s
      );
    }

    console.log('[seed] inserting audit_log...');
    const audit = [
      ['AUD-2026-0001', 'admin@dronedeliver.io',  'mission MSN-2026-0001',    'create',      'success'],
      ['AUD-2026-0002', 'pilot@dronedeliver.io',  'flight FLT-2026-0001',     'takeoff',     'success'],
      ['AUD-2026-0003', 'pilot@dronedeliver.io',  'flight FLT-2026-0001',     'land',        'success'],
      ['AUD-2026-0004', 'admin@dronedeliver.io',  'mission MSN-2026-0012',    'abort',       'success'],
      ['AUD-2026-0005', 'admin@dronedeliver.io',  'drone DRN-008',            'ground',      'success'],
      ['AUD-2026-0006', 'pilot@dronedeliver.io',  'flight FLT-2026-0006',     'rth',         'success'],
      ['AUD-2026-0007', 'admin@dronedeliver.io',  'regulatory REG-2026-0012', 'suspend',     'success'],
      ['AUD-2026-0008', 'viewer@dronedeliver.io', 'mission list',             'view',        'success'],
      ['AUD-2026-0009', 'pilot@dronedeliver.io',  'flight FLT-2026-0012',     'abort',       'success'],
      ['AUD-2026-0010', 'admin@dronedeliver.io',  'corridor COR-011',         'suspend',     'success'],
      ['AUD-2026-0011', 'pilot@dronedeliver.io',  'flight FLT-2026-0003',     'c2_dropout',  'warning'],
      ['AUD-2026-0012', 'admin@dronedeliver.io',  'pilot PLT-015',            'deactivate',  'success'],
      ['AUD-2026-0013', 'admin@dronedeliver.io',  'depot DEP-015',            'offline',     'success'],
      ['AUD-2026-0014', 'pilot@dronedeliver.io',  'flight FLT-2026-0011',     'parachute',   'warning'],
      ['AUD-2026-0015', 'admin@dronedeliver.io',  'customer CUS-012',         'pause',       'success'],
    ];
    for (const a of audit) {
      await client.query(
        `INSERT INTO audit_log (entry_id,actor,target,action,result) VALUES ($1,$2,$3,$4,$5)`,
        a
      );
    }

    console.log('[seed] inserting users...');
    const users = [
      ['admin@dronedeliver.io',  'admin123',  'Admin',     'admin'],
      ['pilot@dronedeliver.io',  'pilot123',  'Pilot',     'pilot'],
      ['viewer@dronedeliver.io', 'viewer123', 'Viewer',    'viewer'],
    ];
    for (const u of users) {
      await client.query(
        `INSERT INTO users (email,password,name,role) VALUES ($1,$2,$3,$4)`,
        u
      );
    }

    console.log('[seed] inserting notifications...');
    const notifications = [
      [1, 'TFR conflict on FLT-2026-0008',  'TFR active over Singapore CTR — flight rerouted',     'high',     'incidents'],
      [1, 'C2 link dropout INC-2026-0003',  'C2 link dropout on FLT-2026-0003 — under investigation','high',    'incidents'],
      [1, 'Battery DRN-010 SoH 68.7%',      'Retire-from-service threshold crossed',                 'medium',   'batteries'],
      [2, 'Weather no-go Frederick CO',     '22.3 kt winds + 800 ft ceiling — defer Wing ops',       'medium',   'weather_briefs'],
      [2, 'Parachute misfire INC-2026-0008','Critical incident closed — pyrotechnic SB issued',      'critical', 'incidents'],
    ];
    for (const n of notifications) {
      await client.query(
        `INSERT INTO notifications (user_id,title,body,severity,source) VALUES ($1,$2,$3,$4,$5)`,
        n
      );
    }

    console.log('[seed] inserting webhooks...');
    const webhooks = [
      ['Ops PagerDuty Bridge',     'https://httpbin.org/post', 'sec_ops_2026',       'incident.created,flight.aborted', true],
      ['Customer Notifier',        'https://httpbin.org/post', 'sec_customer_2026',  'mission.delivered',                true],
    ];
    for (const w of webhooks) {
      await client.query(
        `INSERT INTO webhooks (name,url,secret,events,active) VALUES ($1,$2,$3,$4,$5)`,
        w
      );
    }

    console.log('[seed] complete.');
  } catch (e) {
    console.error('[seed] error:', e);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

run();
