const buildCrud = require('./_crudFactory');

module.exports = buildCrud({
  table: 'drones',
  fields: ['drone_id','model','sn','battery_count','total_flight_hours','status','notes'],
});
