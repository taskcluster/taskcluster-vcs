import rm from './rm';
import run from './run';
import fs from 'mz/fs';
import assert from 'assert';
import mkdirp from 'mkdirp';
import hash from '../../src/hash';
import slugid from 'slugid';
import createTask from './taskcluster';

import { Queue, Index } from 'taskcluster-client';

suite('create clone cache', function() {
  let queue = new Queue();
  let index = new Index();

  test('create cache (git)', async function() {
    let alias = 'bitbucket.org/lightsofapollo/gittesting'
    let url = `https://${alias}`;
    await run(['create-clone-cache', url])
    assert(fs.exists(`${this.home}/clones/${alias}.tar.gz`));
  });

  test('create cache (hg)', async function() {
    let alias = 'bitbucket.org/lightsofapollo/hgtesting'
    let url = `https://${alias}`;
    await run(['create-clone-cache', url])
    assert(fs.exists(`${this.home}/clones/${alias}.tar.gz`));
  });

  test('upload cache', async function() {
    let namespace = 'public.test.jlal.' + slugid.v4();
    let taskId = await createTask();

    let alias = 'bitbucket.org/lightsofapollo/hgtesting'
    let url = `https://${alias}`;
    let expectedName = `public/${alias}.tar.gz`;

    await run([
      'create-clone-cache',
      url,
      '--namespace', namespace,
      '--task-id', taskId,
      '--run-id=0',
      '--upload',
      '--expires=5min'
    ]);

    let { artifacts } = await queue.listArtifacts(taskId, 0);
    assert.equal(artifacts.length, 1, 'has artifacts...');
    assert.equal(artifacts[0].name, expectedName);

    let indexes = await index.findTask(`${namespace}.${hash(alias)}`);
    assert.equal(indexes.taskId, taskId);
  });

});
