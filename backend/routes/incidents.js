const buildCrud = require('./_crudFactory');

module.exports = buildCrud({
  table: 'incidents',
  fields: ['incident_id','flight_id','type','severity','opened_at','status','notes'],
});
