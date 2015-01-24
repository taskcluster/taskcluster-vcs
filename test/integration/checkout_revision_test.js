import rm from './rm';
import run from './run';
import fs from 'mz/fs';
import assert from 'assert';
import mkdirp from 'mkdirp';

suite('checkout-revision', function() {
  async function clean() {
    await rm('./clones/')
    mkdirp.sync(__dirname + '/clones');
  }

  teardown(clean);
  setup(clean);

  test('(git) cached -> then update', async function () {
    let dest = __dirname + '/clones/git-checkout-revision/';
    await run([
      'clone',
      'https://github.com/lightsofapollo/tc-vcs-cache',
      dest
    ]);
    assert((await fs.exists(dest)), 'path exists');

    // The important thing here is this is _not_ the latest commit but the
    // commit I manually stashed in s3.
    assert.equal(
      (await run(['revision', dest]))[0],
      'a2685cb85c46d57c3698e882871db52a8288e0bb'
    );

    let cachePath = __dirname + '/../cache/' +
                    'clones/github.com/lightsofapollo/tc-vcs-cache.tar.gz';

    assert.ok((await fs.exists(cachePath)), 'cache was correctly downloaded');

    await run([
      'checkout-revision',
      dest,
      'https://github.com/lightsofapollo/tc-vcs-cache',
      'master',
      '3b241b02a9860354d416504a476d597783101ac5'
    ]);

    // Current master HEAD
    assert.equal(
      (await run(['revision', dest]))[0],
      '3b241b02a9860354d416504a476d597783101ac5'
    );
  });

 test('(hg) cached -> then update', async function () {
    let dest = __dirname + '/clones/hg-checkout-revision/';
    await run([
      'clone',
      'https://bitbucket.org/lightsofapollo/hgcache',
      dest
    ]);
    assert((await fs.exists(dest)), 'path exists');

    // The important thing here is this is _not_ the latest commit but the
    // commit I manually stashed in s3.
    assert.equal(
      (await run(['revision', dest]))[0],
      'e2cf6ae0b436ea6a6cbb4adecde36d4b25f90119'
    );

    let cachePath = __dirname + '/../cache/' +
                    'clones/bitbucket.org/lightsofapollo/hgcache.tar.gz';

    assert.ok((await fs.exists(cachePath)), 'cache was correctly downloaded');

    await run([
      'checkout-revision',
      dest,
      'https://bitbucket.org/lightsofapollo/hgcache',
      '4357fd7cbfdaad843f760757d809a81f9d313fab',
      '4357fd7cbfdaad843f760757d809a81f9d313fab'
    ]);

    // Current default tip
    assert.equal(
      (await run(['revision', dest]))[0],
      '4357fd7cbfdaad843f760757d809a81f9d313fab'
    );
  });

});

