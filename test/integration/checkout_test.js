import rm from './rm';
import run from './run';
import fs from 'mz/fs';
import assert from 'assert';
import mkdirp from 'mkdirp';

suite('checkout', function() {
  test('checkout in directory which is not controlled by a vcs', async function() {
    // Simply clone to "home" since we expect this to implode anyway...
    await fs.mkdir(this.home);

    try {
      await run([
        'checkout',
        this.home,
        'https://github.com/lightsofapollo/tc-vcs-cache',
        'https://github.com/lightsofapollo/tc-vcs-cache',
        'master',
        '3b241b02a9860354d416504a476d597783101ac5',
      ]);
    } catch (e) {
      assert.ok(e.message.indexOf('not a known vcs type') !== -1)
      return;
    }

    throw new Error('should have thrown an error');
  });

  test('checkout fresh then checkout again', async function () {
    let url = 'https://github.com/lightsofapollo/tc-vcs-cache';
    let dest = `${this.home}/clones/tc-vcs-cache`;

    async function checkout() {
      await run([
        'checkout',
        dest,
        url,
        url,
        'master',
        '3b241b02a9860354d416504a476d597783101ac5'
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
    let dest = `${this.home}/clones/tc-vcs-cache`;
    await run(['create-clone-cache', url]);

    async function checkout() {
      await run([
        'checkout',
        dest,
        url,
        url,
        'master',
        '3b241b02a9860354d416504a476d597783101ac5'
      ]);

      assert.equal(
        (await run(['revision', dest]))[0],
        '3b241b02a9860354d416504a476d597783101ac5'
      );
    }

    await checkout();
    await checkout();
  });


  test('(with defaults) checkout fresh', async function () {
    let url = 'https://github.com/lightsofapollo/tc-vcs-cache'
    let dest = `${this.home}/clones/tc-vcs-cache`;
    await run([
      'checkout',
      dest,
      url
    ]);

    assert.equal(
      (await run(['revision', dest]))[0],
      '3b241b02a9860354d416504a476d597783101ac5'
    );
  });
});


