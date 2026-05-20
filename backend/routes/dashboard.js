const express = require('express');
const router = express.Router();
const pool = require('../config/database');

router.get('/', async (req, res) => {
  try {
    const [
      drones, batteries, flights, missions, customers, packages, depots, vertiports,
      pilots, observers, approvals, zones, weather, maint, incidents, corridors, specs, audit,
    ] = await Promise.all([
      pool.query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status='ready') AS ready, COUNT(*) FILTER (WHERE status='in_flight') AS in_flight, COUNT(*) FILTER (WHERE status='maintenance') AS maintenance FROM drones"),
      pool.query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status='available') AS available, COUNT(*) FILTER (WHERE status='retired') AS retired FROM batteries"),
      pool.query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status='scheduled') AS scheduled, COUNT(*) FILTER (WHERE status='in_flight') AS in_flight, COUNT(*) FILTER (WHERE status='completed') AS completed FROM flights"),
      pool.query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status='scheduled') AS scheduled, COUNT(*) FILTER (WHERE status='in_flight') AS in_flight, COUNT(*) FILTER (WHERE status='completed') AS completed FROM missions"),
      pool.query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status='active') AS active FROM customers"),
      pool.query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status='in_transit') AS in_transit, COUNT(*) FILTER (WHERE status='delivered') AS delivered FROM packages"),
      pool.query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status='active') AS active FROM depots"),
      pool.query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status='active') AS active, COALESCE(SUM(pad_count),0) AS total_pads FROM vertiports"),
      pool.query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status='active') AS active, COUNT(*) FILTER (WHERE status='on_shift') AS on_shift FROM pilots"),
      pool.query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status='on_shift') AS on_shift FROM observers"),
      pool.query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status='approved') AS approved, COUNT(*) FILTER (WHERE status='pending') AS pending FROM regulatory_approvals"),
      pool.query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status='restricted') AS restricted FROM airspace_zones"),
      pool.query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE recommendation='go') AS go, COUNT(*) FILTER (WHERE recommendation='no_go') AS no_go FROM weather_briefs"),
      pool.query("SELECT COUNT(*) AS total FROM maintenance_logs"),
      pool.query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE severity='critical') AS critical, COUNT(*) FILTER (WHERE status='open') AS open FROM incidents"),
      pool.query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status='active') AS active FROM route_corridors"),
      pool.query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE hazmat=true) AS hazmat FROM payload_specs"),
      pool.query("SELECT COUNT(*) AS total FROM audit_log"),
    ]);
    res.json({
      drones: drones.rows[0],
      batteries: batteries.rows[0],
      flights: flights.rows[0],
      missions: missions.rows[0],
      customers: customers.rows[0],
      packages: packages.rows[0],
      depots: depots.rows[0],
      vertiports: vertiports.rows[0],
      pilots: pilots.rows[0],
      observers: observers.rows[0],
      regulatory_approvals: approvals.rows[0],
      airspace_zones: zones.rows[0],
      weather_briefs: weather.rows[0],
      maintenance_logs: maint.rows[0],
      incidents: incidents.rows[0],
      route_corridors: corridors.rows[0],
      payload_specs: specs.rows[0],
      audit_log: audit.rows[0],
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
