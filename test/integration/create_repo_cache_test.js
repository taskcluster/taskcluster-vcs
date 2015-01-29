import rm from './rm';
import run from './run';
import fs from 'mz/fs';
import assert from 'assert';
import mkdirp from 'mkdirp';
import hash from '../../src/hash';
import repoCache from './repo_cache';

import { Queue, Index } from 'taskcluster-client';

suite('create repo cache', function() {
  let url = 'https://github.com/taskcluster/tc-vcs-repo-test';
  let alias = 'github.com/taskcluster/tc-vcs-repo-test';
  let queue = new Queue();
  let index = new Index();

  async function clean() {
    await rm('./clones/')
    mkdirp.sync(__dirname + '/clones');
  }

  teardown(clean);
  setup(clean);

  test('create cache', async function() {
    let command = './config.sh do sources.xml';
    let expectedName = `public/${alias}-${hash(command)}.tar.gz`;
    let [namespace, taskId] = await repoCache(url, command);
    let { artifacts } = await queue.listArtifacts(taskId, 0);
    assert.equal(artifacts.length, 1, 'has artifacts...');
    assert.equal(artifacts[0].name, expectedName);
    let indexes = await index.findTask(
      `${namespace}.${hash(alias)}.${hash(command)}`
    );
    assert.equal(indexes.taskId, taskId);
  });
});

