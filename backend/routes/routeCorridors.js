const buildCrud = require('./_crudFactory');

module.exports = buildCrud({
  table: 'route_corridors',
  fields: ['corridor_id','name','region','start_location','end_location','status','notes'],
});
