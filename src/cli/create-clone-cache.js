import { ArgumentParser } from 'argparse';
import checkout from './checkout';
import fsPath from 'path';
import urlAlias from '../vcs/url_alias';
import createHash from '../hash';
import run from '../vcs/run';
import temp from 'promised-temp';
import Artifacts from '../artifacts';

import * as clitools from '../clitools';

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

  let tcArgs = clitools.taskclusterGroup(parser);

  // Shared arguments....
  ['upload', 'taskId', 'runId', 'expires', 'proxy'].forEach((name) => {
    clitools.arg[name](tcArgs);
  });

  tcArgs.addArgument(['--namespace'], {
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
  let artifacts = new Artifacts(config.cloneCache, queue, index);

  let alias = urlAlias(args.url);
  await artifacts.createLocalArtifact(
    alias,
    fsPath.dirname(dir),
    fsPath.basename(dir)
  );

  if (args.upload) {
    await artifacts.indexAndUploadArtifact(
      alias,
      `${args.namespace}.${createHash(alias)}`,
      {
        taskId: args.taskId,
        runId: args.runId,
        expires: args.expires
      }
    );
  }

  // cleanup after ourselves...
  await run(`rm -rf ${dir}`)
}
