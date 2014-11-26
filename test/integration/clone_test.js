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
    var rev = yield run(['revision', __dirname + '/hg']);
    assert.equal(rev[0], '64050d1ea4bc052aef9352c46bef397974bcb1f4');
  }));

  test('git', co(function* () {
    yield run([
      'clone',
      'https://bitbucket.org/lightsofapollo/gittesting',
      __dirname + '/git'
    ]);
    assert((yield fs.exists(__dirname + '/git/.git')), 'path exists');
    var rev = yield run(['revision', __dirname + '/git']);
    assert.equal(rev[0], '3d8bd58cddfa558b78e947ed04ad8f9a3359ed73');
  }));
});
