const buildCrud = require('./_crudFactory');

module.exports = buildCrud({
  table: 'payload_specs',
  fields: ['spec_id','payload_type','max_weight_kg','dimensions','hazmat','status','notes'],
});
