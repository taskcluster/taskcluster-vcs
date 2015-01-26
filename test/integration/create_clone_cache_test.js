import rm from './rm';
import run from './run';
import fs from 'mz/fs';
import assert from 'assert';
import mkdirp from 'mkdirp';
import hash from '../../src/hash';
import cloneCache from './clone_cache';

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

  test('create cache (git)', async function() {
    let alias = 'bitbucket.org/lightsofapollo/gittesting'
    let expectedName = `public/${alias}.tar.gz`;
    let [namespace, taskId] = await cloneCache(
      'https://bitbucket.org/lightsofapollo/gittesting'
    );

    let { artifacts } = await queue.listArtifacts(taskId, 0);
    assert.equal(artifacts.length, 1, 'has artifacts...');
    assert.equal(artifacts[0].name, expectedName);

    let indexes = await index.findTask(`${namespace}.${hash(alias)}`);
    assert.equal(indexes.taskId, taskId);
  });

  test('create cache (hg)', async function() {
    let alias = 'bitbucket.org/lightsofapollo/hgtesting'
    let expectedName = `public/${alias}.tar.gz`;
    let [namespace, taskId] = await cloneCache(
      'https://bitbucket.org/lightsofapollo/hgtesting'
    );

    let { artifacts } = await queue.listArtifacts(taskId, 0);
    assert.equal(artifacts.length, 1, 'has artifacts...');
    assert.equal(artifacts[0].name, expectedName);

    let indexes = await index.findTask(`${namespace}.${hash(alias)}`);
    assert.equal(indexes.taskId, taskId);
  });

});
