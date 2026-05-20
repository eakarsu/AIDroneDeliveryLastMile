const buildCrud = require('./_crudFactory');

module.exports = buildCrud({
  table: 'packages',
  fields: ['package_id','mission_id','weight_kg','contents_type','destination','status','notes'],
});
