const buildCrud = require('./_crudFactory');

module.exports = buildCrud({
  table: 'weather_briefs',
  fields: ['brief_id','location','valid_at','wind_kt','ceiling_ft','recommendation','notes'],
});
