const buildCrud = require('./_crudFactory');

module.exports = buildCrud({
  table: 'pilots',
  fields: ['pilot_id','name','license','certifications','base','status','notes'],
});
