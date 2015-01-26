import rm from './rm';
import run from './run';
import fs from 'mz/fs';
import assert from 'assert';
import mkdirp from 'mkdirp';
import createTask from './taskcluster';
import hash from '../../src/hash';

import { Queue, Index } from 'taskcluster-client';

suite('create clone cache', function() {
  let queue = new Queue();
  let index = new Index();

  async function clean() {
    await rm('./clones/')
    mkdirp.sync(__dirname + '/clones');
  }

  teardown(clean);
  setup(clean);

  let taskId, namespace;
  setup(async function() {
    taskId = await createTask();
    namespace = `public.jlal.test.tc-vcs.${Date.now()}`
  });

  test('create cache (git)', async function() {
    let alias = 'bitbucket.org/lightsofapollo/gittesting'
    let expectedName = `public/${alias}.tar.gz`;
    await run([
      'create-clone-cache',
      '--namespace', namespace,
      '--task-id', taskId,
      '--run-id', 0,
      'https://bitbucket.org/lightsofapollo/gittesting'
    ]);

    let { artifacts } = await queue.listArtifacts(taskId, 0);
    assert.equal(artifacts.length, 1, 'has artifacts...');
    assert.equal(artifacts[0].name, expectedName);

    let indexes = await index.findTask(`${namespace}.git.${hash(alias)}`);
    assert.equal(indexes.taskId, taskId);
  });

});
