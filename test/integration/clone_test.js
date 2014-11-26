suite('clone', function() {
  var co = require('co');
  var rm = require('./rm');
  var run = require('./run');
  var fs = require('mz/fs');
  var assert = require('assert');
  var mkdirp = require('mkdirp');

  function* clean() {
    yield [rm('./clones/')]
    mkdirp.sync(__dirname + '/clones');
  }

  teardown(co(clean));
  setup(co(clean));

  test('hg', co(function* () {
    var dest = __dirname + '/clones/hg';
    var out = yield run([
      'clone',
      'https://bitbucket.org/lightsofapollo/hgtesting',
      dest
    ]);
    assert((yield fs.exists(dest)), 'path exists');
    var rev = yield run(['revision', dest]);
    assert.equal(rev[0], '64050d1ea4bc052aef9352c46bef397974bcb1f4');
  }));

  test('git', co(function* () {
    var dest = __dirname + '/clones/git';
    yield run([
      'clone',
      'https://bitbucket.org/lightsofapollo/gittesting',
      dest
    ]);
    assert((yield fs.exists(dest)), 'path exists');
    var rev = yield run(['revision', dest]);
    assert.equal(rev[0], '3d8bd58cddfa558b78e947ed04ad8f9a3359ed73');
  }));

  test('cached', co(function* () {
    function* testCache (dest) {
      yield run([
        'clone',
        'https://github.com/lightsofapollo/tc-vcs-cache',
        dest
      ]);
      assert((yield fs.exists(dest)), 'path exists');
      var rev = yield run(['revision', dest]);
      // The important thing here is this is _not_ the latest commit but the
      // commit I manually stashed in s3.
      assert.equal(rev[0], 'a2685cb85c46d57c3698e882871db52a8288e0bb');
      var cachePath = __dirname + '/../cache/' +
                      'clones/github.com/lightsofapollo/tc-vcs-cache.tar.gz';

      assert.ok((yield fs.exists(cachePath)), 'cache was correctly downloaded');
    }

    // Run and rerun the cache a few times to see what happens!
    yield testCache(__dirname + '/clones/cache-1');
    yield testCache(__dirname + '/clones/cache-2');
    yield testCache(__dirname + '/clones/cache-3');
  }));
});
