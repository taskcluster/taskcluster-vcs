import rm from './rm';
import run from './run';
import fs from 'mz/fs';
import assert from 'assert';
import mkdirp from 'mkdirp';
import cloneCache from './clone_cache';

suite('checkout', function() {
  async function clean() {
    await rm('./clones/')
    mkdirp.sync(__dirname + '/clones');
  }

  teardown(clean);
  setup(clean);

  test('checkout in directory which is not controlled by a vcs', async function() {
    let dest = `${__dirname}/clones/tc-vcs-cache`;
    await fs.mkdir(dest);

    try {
      await run([
        'checkout',
        'https://github.com/lightsofapollo/tc-vcs-cache',
        'https://github.com/lightsofapollo/tc-vcs-cache',
        'master',
        '3b241b02a9860354d416504a476d597783101ac5',
        dest
      ]);
    } catch (e) {
      assert.ok(e.message.indexOf('not a known vcs type') !== -1)
      return;
    }

    throw new Error('should have thrown an error');
  });

  test('checkout fresh then checkout again', async function () {
    let url = 'https://github.com/lightsofapollo/tc-vcs-cache'
    let dest = `${__dirname}/clones/tc-vcs-cache`;

    async function checkout() {
      await run([
        'checkout',
        url,
        url,
        'master',
        '3b241b02a9860354d416504a476d597783101ac5',
        dest
      ]);

      assert.equal(
        (await run(['revision', dest]))[0],
        '3b241b02a9860354d416504a476d597783101ac5'
      );
    }

    await checkout();
    await checkout();
  });

  test('(with cache) checkout fresh then checkout again', async function () {
    let url = 'https://github.com/lightsofapollo/tc-vcs-cache'
    let dest = `${__dirname}/clones/tc-vcs-cache`;
    let [namespace] = await cloneCache(url);

    async function checkout() {
      await run([
        'checkout',
        '--namespace', namespace,
        url,
        url,
        'master',
        '3b241b02a9860354d416504a476d597783101ac5',
        dest
      ]);

      assert.equal(
        (await run(['revision', dest]))[0],
        '3b241b02a9860354d416504a476d597783101ac5'
      );
    }

    await checkout();
    await checkout();
  });
});


