const buildCrud = require('./_crudFactory');

module.exports = buildCrud({
  table: 'airspace_zones',
  fields: ['zone_id','name','classification','region','restrictions','status','notes'],
});
