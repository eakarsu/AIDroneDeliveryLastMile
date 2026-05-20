const buildCrud = require('./_crudFactory');

module.exports = buildCrud({
  table: 'customers',
  fields: ['customer_id','name','contact','type','region','status','notes'],
});
