import rm from './rm';
import run from './run';
import fs from 'mz/fs';
import fsPath from 'path';
import assert from 'assert';
import mkdirp from 'mkdirp';
import hash from '../../src/hash';
import slugid from 'slugid';
import createTask from './taskcluster';

import { Queue, Index } from 'taskcluster-client';

suite('create repo cache', function() {
  this.timeout('80s');
  let url = 'https://github.com/taskcluster/tc-vcs-repo-test';
  let queue = new Queue();
  let index = new Index();

  test('create cache', async function() {
    let source = 'bitbucket.org/lightsofapollo/gittesting/master';
    await run(['create-repo-cache', url, 'sources.xml']);
    assert(fs.exists(`${this.home}/repo/sources/${source}.tar.gz`));
  });

  test('@taskcluster multi-project cache', async function() {
    let projects = [
      'bitbucket.org/lightsofapollo/gittesting/master',
      'github.com/lightsofapollo/repo-gittesting/master'
    ];

    let namespace = 'public.test.jlal.' + slugid.v4();
    let taskId = await createTask();
    await run([
      'create-repo-cache',
      '--upload',
      '--namespace', namespace,
      '--task-id', taskId,
      '--expires', '5 min',
      '--run-id', 0,
      url, 'bigger.xml'
    ]);

    let { artifacts } = await queue.listArtifacts(taskId, 0);
    let names = artifacts.map((v) => {
      return v.name
    });

    assert.deepEqual(names, projects.map((v) => {
      return `public/${v}.tar.gz`
    }));

    await Promise.all(projects.map(async (v) => {
      let task = await index.findTask(`${namespace}.${hash(v)}`);
      assert.equal(task.taskId, taskId);
    }))
  });
});

