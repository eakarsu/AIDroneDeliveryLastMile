const buildCrud = require('./_crudFactory');

module.exports = buildCrud({
  table: 'batteries',
  fields: ['battery_id','drone_id','cycles','soh_pct','last_charge','status','notes'],
});
