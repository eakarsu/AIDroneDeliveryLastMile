const buildCrud = require('./_crudFactory');

module.exports = buildCrud({
  table: 'observers',
  fields: ['observer_id','name','location','certifications','status','contact','notes'],
});
