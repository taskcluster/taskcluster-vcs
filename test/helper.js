var co = require('co');

suiteSetup(co(function* () {
  yield require('./integration/rm_cache')();
}));

suiteTeardown(co(function* () {
  yield require('./integration/rm_cache')();
}));

process.env['TC_VCS_HOME'] = __dirname + '/cache/';
