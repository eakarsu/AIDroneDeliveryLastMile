const buildCrud = require('./_crudFactory');

module.exports = buildCrud({
  table: 'flights',
  fields: ['flight_id','drone_id','mission_id','takeoff_at','landing_at','status','notes'],
});
