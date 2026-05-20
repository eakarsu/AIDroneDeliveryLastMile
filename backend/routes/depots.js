const buildCrud = require('./_crudFactory');

module.exports = buildCrud({
  table: 'depots',
  fields: ['depot_id','name','location','capacity','status','manager','notes'],
});
