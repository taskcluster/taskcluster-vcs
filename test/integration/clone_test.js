import assert from 'assert';
import { exec } from 'mz/child_process';
import fs from 'mz/fs';
import mkdirp from 'mkdirp';
import path from 'path';
import slugid from 'slugid';

import createTask from './taskcluster';
import hash from '../../src/hash';
import detectLocal from '../../src/vcs/detect_local';
import { Index } from 'taskcluster-client';
import run from './run';

let index = new Index();

suite('clone', function() {
  test('hg', async function() {
    let dest = `${this.home}/hg`;
    let out = await run([
      'clone',
      '--namespace=public.test.taskcluster-vcs-garbage',
      '--force-clone',
      'https://bitbucket.org/lightsofapollo/hgtesting',
      dest
    ]);
    assert((await fs.exists(dest)), 'path exists');
    let rev = await run(['revision', dest]);
    assert.equal(rev[0], '5d3acb7ef08f1c988b6f34ade72718a10a6ac123');
  });

  test('git', async function () {
    let dest = `${this.home}/git`;
    await run([
      'clone',
      '--force-clone',
      '--namespace=not-vcs-test',
      'https://bitbucket.org/lightsofapollo/gittesting',
      dest
    ]);
    assert((await fs.exists(dest)), 'path exists');
    let rev = await run(['revision', dest]);
    assert.equal(rev[0], '3d8bd58cddfa558b78e947ed04ad8f9a3359ed73');
  });

  test('cached', async function () {
    let home = this.home;
    let alias = 'github.com/lightsofapollo/tc-vcs-cache';
    let url = `https://${alias}`;
    await run(['create-clone-cache', '--force-clone', url]);
    async function testCache (dest) {
      await run([
        'clone',
        url,
        dest
      ]);

      assert((await fs.exists(dest)), 'path exists');
      let rev = await run(['revision', dest]);
      let cachePath = `${home}/clones/${alias}.tar.gz`;
      assert.ok((await fs.exists(cachePath)), 'cache was correctly downloaded');
    }

    // Run and rerun the cache a few times to see what happens!
    await testCache(`${home}/cache-1`);
    await testCache(`${home}/cache-2`);
    await testCache(`${home}/cache-3`);
  });

  test('@taskcluster force-clone disabled (by default) - fails to clone', async function(done) {
    let alias = 'bitbucket.org/lightsofapollo/hgtesting'
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

    let out = await run([
      'clone',
      `--namespace=${namespace}`,
      // XXX: Change all references to these repos in the tests
      'https://bitbucket.org/lightsofapollo/hgtesting',
      dest
    ]).catch(async (err) => {;
      let exists = await fs.exists(dest);
      assert.ok(!exists, 'Cloned path should not exist.');
      assert.ok(
        err.message.includes('Could not clone repository using cached copy') &&
        err.message.includes('force-clone'),
        'Error message does not indicate that force-clone should be used'
      );
      done();
    });

    assert(false, 'Command completed successfully when it should not have');
  });

  test('@taskcluster force-clone enabled - clone from repository when no artifact present', async function() {
    let alias = 'bitbucket.org/lightsofapollo/hgtesting'
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

    let out = await run([
      'clone',
      '--force-clone',
      `--namespace=${namespace}`,
      // XXX: Change all references to these repos in the tests
      'https://bitbucket.org/lightsofapollo/hgtesting',
      dest
    ]);

    let exists = await fs.exists(dest);
    assert.ok(exists, 'Cloned path does not exist.');

    let localType = await detectLocal(dest);
    assert.equal(localType.type, 'hg', 'Cloned repository is not the correct vcs type');
  });
});
