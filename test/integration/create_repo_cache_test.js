import rm from './rm';
import run from './run';
import fs from 'mz/fs';
import fsPath from 'path';
import assert from 'assert';
import mkdirp from 'mkdirp';
import hash from '../../src/hash';
import repoCache from './repo_cache';

import { Queue, Index } from 'taskcluster-client';

suite('create repo cache', function() {
  this.timeout('80s');
  let url = 'https://github.com/taskcluster/tc-vcs-repo-test';
  let queue = new Queue();
  let index = new Index();

  async function clean() {
    await rm('./clones/')
    mkdirp.sync(__dirname + '/clones');
  }

  teardown(clean);
  setup(clean);

  test('create cache', async function() {
    let alias = 'bitbucket.org/lightsofapollo/gittesting/master';
    let expectedName = `public/${alias}.tar.gz`;
    let [namespace, taskId] = await repoCache(url, 'sources.xml');
    let { artifacts } = await queue.listArtifacts(taskId, 0);
    assert.equal(artifacts.length, 1, 'has artifacts...');
    assert.equal(artifacts[0].name, expectedName);
    let indexes = await index.findTask(
      `${namespace}.${hash(alias)}`
    );
    assert.equal(indexes.taskId, taskId);
  });

  test('multi-project cache', async function() {
    let [namespace, taskId] = await repoCache(url, 'bigger.xml');
    let { artifacts } = await queue.listArtifacts(taskId, 0);
    console.log(JSON.stringify(artifacts));
  });
});

