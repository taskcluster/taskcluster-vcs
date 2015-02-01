import { ArgumentParser, RawDescriptionHelpFormatter } from 'argparse';
import checkout from './checkout';
import run from '../vcs/run';
import render from 'json-templater/string';
import fs from 'mz/fs';
import fsPath from 'path';
import temp from 'promised-temp';
import urlAlias from '../vcs/url_alias';
import createHash from '../hash';
import vcsRepo from '../vcs/repo';

import { Index, Queue } from 'taskcluster-client';

const STATS_FILE = '.tc-vcs-cache-stats.json';

// Used in read only fashion so no need to wait to construct...
let queue = new Queue();
let index = new Index();

async function useProjectCaches(config, target, namespace, branch, projects) {
  let start = Date.now();
  let stats = {
    start: new Date(),
    duration: null,
    projects: {}
  };

  await Promise.all(projects.map(async (project) => {
    let start = Date.now();
    let [taskId, cacheUrl] = await getProjectCache(
      config, namespace, project.remote, branch
    );

    if (cacheUrl) {
      await useCache(config, cacheUrl, target);
    }

    stats.projects[project.name] = {
      duration: Date.now() - start,
      taskId: taskId
    };

    await vcsRepo.sync(config, target, {
      project: project.name
    });
  }));

  stats.duration = Date.now() - start;
  stats.stop = new Date();
  await fs.writeFile(
    fsPath.join(target, '.repo', STATS_FILE),
    JSON.stringify(stats, null, 2)
  );
}

/**
Determines if the clone has a cache if it does return a url do it.
*/
async function getProjectCache(config, namespace, remote, branch) {
  // normalize the url to the "name"
  let alias = `${urlAlias(remote)}/${branch}`;
  let namespace = `${namespace}.${createHash(alias)}`;

  let task;
  try {
    task = await index.findTask(namespace);
  } catch (e) {
    // 404 will throw so validate before returning null...
    if (e.code && e.code != 404) throw e;
    return [];
  }

  // Note that unlike some other caches we do not cache repo data locally (at
  // least not yet...).
  let url = queue.buildUrl(queue.getLatestArtifact,
    task.taskId,
    `public/${alias}.tar.gz`
  );
  return [task.taskId, url];
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
    defaultValue: 'tc-vcs.v1.repo-project',
    help: `
      Namespace under Index to query should match the value set in
      create-clone-cache.
    `.trim()
  });

  parser.addArgument(['-b', '--branch'], {
    dest: 'branch',
    defaultValue: 'master',
    help: 'branch argument to pass (-b) to repo init'
  });

  parser.addArgument(['-m', '--manifest'], {
    required: true,
    dest: 'manifest',
    help: `
      Manifest xml file to use to initialize repo.
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

  // Initialize the directory with the repo command...
  await vcsRepo.init(config, args.directory, args.manifest, {
    branch: args.branch
  });

  // Determine the list of projects...
  let projects = await vcsRepo.list(config, args.directory);
  await useProjectCaches(
    config, args.directory, args.namespace, args.branch, projects
  );

  if (!await fs.exists(fsPath.join(args.directory, '.repo'))) {
    console.error(`${args.command} ran but did not generate a .repo directory`);
    process.exit(1);
  }
}
