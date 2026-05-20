const buildCrud = require('./_crudFactory');

module.exports = buildCrud({
  table: 'vertiports',
  fields: ['vertiport_id','depot_id','location','pad_count','status','operator','notes'],
});
