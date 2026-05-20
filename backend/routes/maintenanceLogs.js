const buildCrud = require('./_crudFactory');

module.exports = buildCrud({
  table: 'maintenance_logs',
  fields: ['log_id','drone_id','work','technician','hours','completed_at','notes'],
});
