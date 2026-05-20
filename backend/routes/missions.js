const buildCrud = require('./_crudFactory');

module.exports = buildCrud({
  table: 'missions',
  fields: ['mission_id','customer_id','pickup','dropoff','payload_kg','status','notes'],
});
