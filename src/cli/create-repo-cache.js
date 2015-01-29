import { ArgumentParser } from 'argparse';
import repoCheckout from './repo-checkout';
import temp from 'promised-temp';
import render from 'json-templater/string';
import fs from 'mz/fs';
import fsPath from 'path';
import ms from 'ms';
import urlAlias from '../vcs/url_alias';
import createHash from '../hash';
import run from '../vcs/run';

import { Index, Queue } from 'taskcluster-client';

async function createTar(config, source, dest) {
  let cwd = fsPath.dirname(source);
  let dir = fsPath.basename(source);

  await run(render(config.repoCache.compress, { source: dir, dest }), {
    cwd,
  });
}

async function uploadTar(config, source, url) {
  await run(render(config.repoCache.uploadTar, {
    source, url
  }));
}

export default async function main(config, argv) {
  let parser = new ArgumentParser({
    prog: 'tc-vcs create-repo-cache',
    version: require('../../package').version,
    addHelp: true,
    description: `
      Clones (using the cache if possible) and updates the given repository to
      the current tip of the default branch. After clone/update the index will
      be updated to point to the given task and rank updated to current utc time.

      This primary way this is different from create-clone-cache is the use of
      repo-checkout and the caching of _only_ the .repo folder...
    `.trim()
  });

  parser.addArgument(['--task-id'], {
    required: true,
    dest: 'taskId',
    defaultValue: process.env.TASK_ID,
    help: 'Taskcluster task ID'
  });

  parser.addArgument(['--run-id'], {
    required: true,
    dest: 'runId',
    defaultValue: process.env.RUN_ID,
    help: 'Taskcluster run ID'
  });

  parser.addArgument(['--namespace'], {
    defaultValue: 'tc-vcs.v1.repo-init',
    help: 'Taskcluster Index namespace'
  });

  parser.addArgument(['-c', '--command'], {
    help: 'command to use to create repo cache',
    required: true
  });

  parser.addArgument(['--expires'], {
    defaultValue: '30 days',
    help: `
      Expiration for artifact and index value is parsed by the ms npm module
      some other examples:


        1 minute
        3 days
        2 years

    `.trim()
  });

  parser.addArgument(['--proxy'], {
    default: false,
    action: 'storeTrue',
    help: `
      Use docker-worker proxy when uploading artifacts and indexes. This should
      always be true when using the docker worker with this command.
   `.trim()
  });

  parser.addArgument(['url'], {
    help: 'url which to clone from'
  });

  // configuration for clone/update....
  let args = parser.parseArgs(argv);
  let dir = temp.path('tc-vcs-create-repo-cache');

  // Clone and update cache...
  await repoCheckout(config, [
    dir, args.url,
    '--namespace', args.namespace,
    '--command', args.command
  ]);

  let queueOpts = {};
  let indexOpts = {};

  // Set proxy urls if configured.
  if (args.proxy) {
    queueOpts.baseUrl = 'taskcluster/queue/v1';
    indexOpts.baseUrl = 'taskcluster/index/v1';
  }

  let queue = new Queue(queueOpts);
  let index = new Index(indexOpts);

  let tarPath = temp.path('tc-vcs-create-repo-cache-tar');
  let repoPath = fsPath.join(dir, '.repo');

  // Add meta data to the .repo folder for testing and for any cases where we
  // need to figure out where the cache came from...
  let metadataPath = fsPath.join(repoPath, '.tc-vcs.json');
  await fs.writeFile(metadataPath, JSON.stringify({
    version: require('../../package').version,
    namespace: args.namespace,
    command: args.command,
    taskId: args.taskId,
    runId: args.runId,
    created: Date.now()
  }));

  await createTar(config, repoPath, tarPath);

  let alias = urlAlias(args.url);
  let expiration = new Date(Date.now() + ms(args.expires));

  let artifact = await queue.createArtifact(
    args.taskId,
    args.runId,
    `public/${alias}-${createHash(args.command)}.tar.gz`,
    {
      storageType: 's3',
      expires: expiration,
      contentType: 'application/x-tar'
    }
  );

  await uploadTar(config, tarPath, artifact.putUrl);

  let namespace = [
    args.namespace,
    createHash(alias),
    createHash(args.command)
  ].join('.');

  await index.insertTask(namespace, {
    taskId: args.taskId,
    // Note: While we _can_ determine a few useful different ways of ranking a
    // single repository (number of commits, last date of commit, etc...) using
    // a simple Date.now + a periodic caching system is likely to yield better
    // results with similar amount of churn...
    rank: Date.now(),
    data: {},
    expires: expiration
  });

  // cleanup after ourselves...
  await run(`rm -rf ${dir} ${tarPath}`)
}

