suite('clone', function() {
  var co = require('co');
  var rm = require('./rm');
  var run = require('./run');
  var fs = require('mz/fs');
  var assert = require('assert');

  function* clean() {
    yield [rm('./hg'), rm('./git')];
  }

  teardown(co(clean));
  setup(co(clean));

  test('hg', co(function* () {
    yield run([
      'clone',
      'https://bitbucket.org/lightsofapollo/hgtesting',
      __dirname + '/hg'
    ]);
    assert((yield fs.exists(__dirname + '/hg/.hg')), 'path exists');
  }));

  test('git', co(function* () {
    yield run([
      'clone',
      'https://bitbucket.org/lightsofapollo/gittesting',
      __dirname + '/git'
    ]);
    assert((yield fs.exists(__dirname + '/git/.git')), 'path exists');
  }));
});
