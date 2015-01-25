suiteSetup(async function () {
  await require('./integration/rm_cache')();
});

suiteTeardown(async function () {
  await require('./integration/rm_cache')();
});

process.env['TC_VCS_HOME'] = __dirname + '/cache/';
