import { ArgumentParser, RawDescriptionHelpFormatter } from 'argparse';
import checkout from './checkout';
import run from '../vcs/run';
import render from 'json-templater/string';
import fs from 'mz/fs';
import fsPath from 'path';
import temp from 'promised-temp';
import urlAlias from '../vcs/url_alias';
import createHash from '../hash';

import { Index, Queue } from 'taskcluster-client';

// Used in read only fashion so no need to wait to construct...
let queue = new Queue();
let index = new Index();

/**
Determines if the clone has a cache if it does return a url do it.
*/
async function getRepoCache(config, namespace, url, command) {
  // normalize the url to the "name"
  let alias = urlAlias(url);
  let namespace = [
    namespace,
    createHash(alias),
    createHash(command)
  ].join('.');

  let task;
  try {
    task = await index.findTask(namespace);
  } catch (e) {
    // 404 will throw so validate before returning null...
    if (e.code && e.code != 404) throw e;
    return null;
  }

  // Note that unlike some other caches we do not cache repo data locally (at
  // least not yet...).
  return queue.buildUrl(queue.getLatestArtifact,
    task.taskId,
    `public/${alias}-${createHash(command)}.tar.gz`
  );
}

async function useCache(config, url, dest) {
  let tempPath = temp.path();
  try {
    await run(render(config.repoCache.get, {
      url: url,
      dest: tempPath
    }));

    await run(render(config.repoCache.extract, {
      source: tempPath,
      dest
    }));
  } catch (e) {
    throw e;
  } finally {
    // Ensure we clean up the temp file it may be massive!
    if (await fs.exists(tempPath)) {
      await fs.unlink(tempPath);
    }
  }
}

export default async function main(config, argv) {
  let parser = new ArgumentParser({
    prog: 'tc-vcs repo-checkout',
    version: require('../../package').version,
    addHelp: true,
    formatterClass: RawDescriptionHelpFormatter,
    description: `
      The primary reason to use this command is to utlize the underlying caches
      which the create-repo-cache command creates. The '.repo' directory will be
      expanded from the cache prior to running your command if avaialble.

      Examples:

        # Clone and cache b2g
        tc-vcs repo-checkout -c './config.sh emulator-kk' b2g https://github.com/mozilla/mozilla-b2g

    `.trim()
  });

  parser.addArgument(['--namespace'], {
    defaultValue: 'tc-vcs.v1.repo-init',
    help: `
      Namespace under Index to query should match the value set in
      create-clone-cache.
    `.trim()
  });

  parser.addArgument(['-c', '--command'], {
    required: true,
    help: `
      Command to use to initialize repo this is run with a bash shell.
    `
  });

  parser.addArgument(['directory'], {
    type: (value) => {
      return fsPath.resolve(value);
    },
    help: 'Target directory which to clone and update'
  });

  parser.addArgument(['baseUrl'], {
    help: 'Base repository to clone',
  });

  parser.addArgument(['headUrl'], {
    help: `
      Head url to fetch changes from. If this value is not given baseUrl is used.
    `,
    nargs: '?'
  });

  parser.addArgument(['headRev'], {
    help: `
      Revision/changeset to pull from the repository. If not given this defaults
      to the "tip"/"master" of the default branch.
    `,
    nargs: '?'
  });

  parser.addArgument(['headRef'], {
    help: `
      Reference on head to fetch this should usually be the same value as
      headRev primarily this may be needed for cases where you are fetching a
      revision from a git branch but must fetch the reference and then proceede
      to checkout the particular revision you want (git generally does not support
      pulling specific revisions only references).

      If not given defaults to headRev.
    `.trim(),
    nargs: '?'
  });

  let args = parser.parseArgs(argv);
  let checkoutArgs = [
    args.directory,
    args.baseUrl,
    args.headUrl,
    args.headRev,
    args.headRef,
  ].filter((v) => {
    // don't include values that are null, etc...
    return !!v;
  });

  // Checkout the underlying repository before running repo...
  await checkout(config, checkoutArgs);

  // If this is a brand new repository attempt to prefill .repo...
  if (!await fs.exists(fsPath.join(args.directory, '.repo'))) {
    let cacheUrl = await getRepoCache(
      config, args.namespace, args.baseUrl, args.command
    );

    if (cacheUrl) {
      await useCache(config, cacheUrl, args.directory);
    }
  }

  // Running the command again should bring us to an updated state...
  await run(args.command, { cwd: args.directory });

  if (!await fs.exists(fsPath.join(args.directory, '.repo'))) {
    console.error(`${args.command} ran but did not generate a .repo directory`);
    process.exit(1);
  }
}
