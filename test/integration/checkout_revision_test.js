import rm from './rm';
import run from './run';
import fs from 'mz/fs';
import assert from 'assert';
import mkdirp from 'mkdirp';

suite('checkout-revision', function() {
  test('(git) cached -> then update', async function () {
    let alias = 'github.com/lightsofapollo/tc-vcs-cache';
    let url = `https://${alias}`;
    await run(['create-clone-cache', url]);

    let dest =  `${this.home}/clones/git-checkout-revision/`;
    await run([
      'clone',
      url,
      dest
    ]);
    assert((await fs.exists(dest)), 'path exists');

    let cachePath = `${this.home}/clones/${alias}.tar.gz`
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
    let alias = 'bitbucket.org/lightsofapollo/hgcache';
    let url = `https://${alias}`;
    await run(['create-clone-cache', url]);

    let dest = `${this.home}/clones/hg-checkout-revision`;
    await run([
      'clone',
      url,
      dest
    ]);
    assert((await fs.exists(dest)), 'path exists');

    let cachePath = `${this.home}/clones/${alias}.tar.gz`
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

