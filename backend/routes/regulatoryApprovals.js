const buildCrud = require('./_crudFactory');

module.exports = buildCrud({
  table: 'regulatory_approvals',
  fields: ['approval_id','mission_id','authority','type','status','issued_at','notes'],
});
