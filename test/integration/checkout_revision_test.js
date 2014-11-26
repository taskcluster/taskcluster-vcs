suite('checkout-revision', function() {
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

  test('(git) cached -> then update', co(function* () {
    var dest = __dirname + '/clones/git-checkout-revision/';
    yield run([
      'clone',
      'https://github.com/lightsofapollo/tc-vcs-cache',
      dest
    ]);
    assert((yield fs.exists(dest)), 'path exists');

    // The important thing here is this is _not_ the latest commit but the
    // commit I manually stashed in s3.
    assert.equal(
      (yield run(['revision', dest]))[0],
      'a2685cb85c46d57c3698e882871db52a8288e0bb'
    );

    var cachePath = __dirname + '/../cache/' +
                    'clones/github.com/lightsofapollo/tc-vcs-cache.tar.gz';

    assert.ok((yield fs.exists(cachePath)), 'cache was correctly downloaded');

    yield run([
      'checkout-revision',
      dest,
      'https://github.com/lightsofapollo/tc-vcs-cache',
      'master',
      '3b241b02a9860354d416504a476d597783101ac5'
    ]);

    // Current master HEAD
    assert.equal(
      (yield run(['revision', dest]))[0],
      '3b241b02a9860354d416504a476d597783101ac5'
    );
  }));

 test('(hg) cached -> then update', co(function* () {
    var dest = __dirname + '/clones/hg-checkout-revision/';
    yield run([
      'clone',
      'https://bitbucket.org/lightsofapollo/hgcache',
      dest
    ]);
    assert((yield fs.exists(dest)), 'path exists');

    // The important thing here is this is _not_ the latest commit but the
    // commit I manually stashed in s3.
    assert.equal(
      (yield run(['revision', dest]))[0],
      'e2cf6ae0b436ea6a6cbb4adecde36d4b25f90119'
    );

    var cachePath = __dirname + '/../cache/' +
                    'clones/bitbucket.org/lightsofapollo/hgcache.tar.gz';

    assert.ok((yield fs.exists(cachePath)), 'cache was correctly downloaded');

    yield run([
      'checkout-revision',
      dest,
      'https://bitbucket.org/lightsofapollo/hgcache',
      '4357fd7cbfdaad843f760757d809a81f9d313fab',
      '4357fd7cbfdaad843f760757d809a81f9d313fab'
    ]);

    // Current default tip
    assert.equal(
      (yield run(['revision', dest]))[0],
      '4357fd7cbfdaad843f760757d809a81f9d313fab'
    );
  }));


});

