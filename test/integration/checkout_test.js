import assert from 'assert';
import fs from 'mz/fs';
import mkdirp from 'mkdirp';
import slugid from 'slugid';
import { Index } from 'taskcluster-client';

import createTask from './taskcluster';
import hash from '../../src/hash';
import rm from './rm';
import run from './run';

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

  test('checkout git then hg...', async function() {
    let dest = `${this.home}/clones/tc-vcs-cache`;
    await run([
      'checkout',
      '--force-clone',
      dest,
      'https://github.com/lightsofapollo/tc-vcs-cache'
    ]);
    await run([
      'checkout',
      '--force-clone',
      dest,
      'https://bitbucket.org/lightsofapollo/hgtesting',
    ]);
    let rev = await run(['revision', dest]);
    assert.equal(rev[0], '5d3acb7ef08f1c988b6f34ade72718a10a6ac123');
  });

  test('checkout fresh then checkout again', async function () {
    let url = 'https://github.com/lightsofapollo/tc-vcs-cache';
    let dest = `${this.home}/clones/tc-vcs-cache`;

    async function checkout() {
      await run([
        'checkout',
        '--force-clone',
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
    await run(['create-clone-cache', '--force-clone', url]);

    async function checkout() {
      await run([
        'checkout',
        '--force-clone',
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
      '--force-clone',
      dest,
      url
    ]);

    assert.equal(
      (await run(['revision', dest]))[0],
      '3b241b02a9860354d416504a476d597783101ac5'
    );
  });

  test('checkout remote branch', async function () {
    let url = 'https://github.com/lightsofapollo/build-mozharness';
    let dest = `${this.home}/clones/mozharness`;
    await run([
      'checkout',
      '--force-clone',
      dest,
      url,
      url,
      'emulator-perf-new'
    ]);
    assert.equal(
      (await run(['revision', dest]))[0],
      '35d7cc561a62eaec54ca53a3d43d1443754f9c98'
    );
  });

  test('checkout remote branch (with local ref)', async function () {
    let url = 'https://github.com/lightsofapollo/build-mozharness';
    let dest = `${this.home}/clones/mozharness`;
    await run([
      'checkout',
      '--force-clone',
      dest,
      url,
      url,
      'emulator-perf'
    ]);
    assert.equal(
      (await run(['revision', dest]))[0],
      'd60ffcf4b975f6f7b42215c7aed53274ceb6eb88'
    );
  });

  test('checkout revision', async function () {
    let url = 'https://github.com/lightsofapollo/build-mozharness';
    let dest = `${this.home}/clones/mozharness`;
    await run([
      'checkout',
      '--force-clone',
      dest,
      url,
      url,
      'd60ffcf4b975f6f7b42215c7aed53274ceb6eb88'
    ]);
    assert.equal(
      (await run(['revision', dest]))[0],
      'd60ffcf4b975f6f7b42215c7aed53274ceb6eb88'
    );
  });

  test('checkout slash', async function () {
    let url = 'https://github.com/walac/tc-vcs-slash-test-case';
    let dest = `${this.home}/clones/mozharness`;
    await run([
      'checkout',
      '--force-clone',
      dest,
      url,
      url,
      'bugz/9999'
    ]);
    assert.equal(
      (await run(['revision', dest]))[0],
      'eafd3e166af5a77d4138790ae43a4d4f1a043d2a'
    );
  });

  test('unindexed repo cannot be checkedout without force clone', async function () {
    // Repo should always be around as long as a CLI client is available for github,
    // should be safe for this test.
    let url = 'https://github.com/github/hub';
    let dest = `${this.home}/clones/github_hub`;
    try {
      await run([
        'checkout',
        dest,
        url,
        url,
        '9999'
      ]);
    } catch(e) {
      assert(
        e.message.includes('[taskcluster-vcs:warning] No task indexed'),
        'Error should indicate that the task is not indexed'
      );
      return;
    }

    throw new Error('Error was not raised when repository has not been indexed');
  });

  test('@taskcluster cannot checkout repo that is indexed but no artifact present', async function() {
    let index = new Index();
    let alias = 'github.com/github/hub'
    let dest = `${this.home}/hg`;
    let namespace = `public.test.taskcluster-vcs-garbage.${slugid.v4()}`;
    let taskId = await createTask();

    let indexOptions = {
      taskId: taskId,
      rank: 1,
      data: {},
      expires: new Date(Date.now() + 60 * 1000)
    };

    await index.insertTask(`${namespace}.${hash(alias)}`, indexOptions);

    try {
      await run([
        'checkout',
        `--namespace=${namespace}`,
        dest,
        'https://github.com/github/hub',
        'https://github.com/github/hub',
        '9999'
      ]);
    } catch(e) {
      let expected = `Artifact "public/github.com/github/hub.tar.gz" not ` +
                     `found for task ID ${taskId}`;
      assert(
        e.message.includes(expected),
        'Error message does not indicate that artifact could not be found'
      );
      return;
    }

    throw new Error('Error was not raised when artifact could not be found for indexed repo');
});
});


