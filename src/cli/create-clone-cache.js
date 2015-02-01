import { ArgumentParser } from 'argparse';
import checkout from './checkout';
import temp from 'promised-temp';
import render from 'json-templater/string';
import fs from 'mz/fs';
import fsPath from 'path';
import urlAlias from '../vcs/url_alias';
import createHash from '../hash';
import run from '../vcs/run';

import * as clitools from '../clitools';

async function createTar(config, source, dest) {
  let cwd = fsPath.dirname(source);
  let dir = fsPath.basename(source);

  await run(render(config.cloneCache.compress, { source: dir, dest }), {
    cwd,
  });
}

async function uploadTar(config, source, url) {
  await run(render(config.cloneCache.uploadTar, {
    source, url
  }));
}

export default async function main(config, argv) {
  let parser = new ArgumentParser({
    prog: 'tc-vcs create-clone-cache',
    version: require('../../package').version,
    addHelp: true,
    description: `
      Clones (using the cache if possible) and updates the given repository to
      the current tip of the default branch. After clone/update the index will
      be updated to point to the given task and rank updated to current utc time
    `.trim()
  });

  // Shared arguments....
  ['taskId', 'runId', 'expires', 'proxy'].forEach((name) => {
    clitools.arg[name](parser);
  });

  parser.addArgument(['--namespace'], {
    defaultValue: 'tc-vcs.v1.clones',
    help: 'Taskcluster Index namespace'
  });

  parser.addArgument(['url'], {
    help: 'url which to clone from'
  });

  // configuration for clone/update....
  let args = parser.parseArgs(argv);
  let dir = temp.path('tc-vcs-create-clone-cache');

  // Clone and update cache...
  await checkout(config, [dir, args.url, '--namespace', args.namespace]);

  let queue = clitools.getTcQueue(args.proxy);
  let index = clitools.getTcIndex(args.proxy);

  let tarPath = temp.path('tc-vcs-create-clone-cache-tar');
  await createTar(config, dir, tarPath);

  let alias = urlAlias(args.url);

  let artifact = await queue.createArtifact(
    args.taskId,
    args.runId,
    `public/${alias}.tar.gz`,
    {
      storageType: 's3',
      expires: args.expires,
      contentType: 'application/x-tar'
    }
  );

  await uploadTar(config, tarPath, artifact.putUrl);

  let hash = createHash(alias);
  let namespace = `${args.namespace}.${hash}`;

  await index.insertTask(namespace, {
    taskId: args.taskId,
    // Note: While we _can_ determine a few useful different ways of ranking a
    // single repository (number of commits, last date of commit, etc...) using
    // a simple Date.now + a periodic caching system is likely to yield better
    // results with similar amount of churn...
    rank: Date.now(),
    data: {},
    expires: args.expires
  });

  // cleanup after ourselves...
  await run(`rm -rf ${dir} ${tarPath}`)
}
