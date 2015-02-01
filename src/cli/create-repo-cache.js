import { ArgumentParser } from 'argparse';
import repoCheckout from './repo-checkout';
import vcsRepo from '../vcs/repo';
import temp from 'promised-temp';
import fsPath from 'path';
import urlAlias from '../vcs/url_alias';
import createHash from '../hash';
import run from '../vcs/run';
import Artifacts from '../artifacts';

import * as clitools from '../clitools';

export default async function main(config, argv) {
  let parser = new ArgumentParser({
    prog: 'tc-vcs create-repo-cache',
    version: require('../../package').version,
    addHelp: true,
    description: `
      Clones (using the cache if possible) and updates the given repository to
      the current tip of the default branch.

      Each "project" that is part of the repo manifest will be cached.
    `.trim()
  });

  let tcArgs = clitools.taskclusterGroup(parser);

  // Shared arguments....
  ['upload', 'taskId', 'runId', 'expires', 'proxy'].forEach((name) => {
    clitools.arg[name](tcArgs);
  });

  tcArgs.addArgument(['--namespace'], {
    defaultValue: 'tc-vcs.v1.repo-project',
    help: 'Taskcluster Index namespace'
  });

  parser.addArgument(['-b', '--branch'], {
    dest: 'branch',
    defaultValue: 'master',
    help: 'branch argument to pass (-b) to repo init'
  });

  parser.addArgument(['url'], {
    help: 'url which to clone from'
  });

  parser.addArgument(['manifest'], {
    help: `
      local path or URL to the manifest.
    `
  });

  // configuration for clone/update....
  let args = parser.parseArgs(argv);
  let queue = clitools.getTcQueue(args.proxy);
  let index = clitools.getTcIndex(args.proxy);
  let workspace = temp.path('tc-vcs-create-repo-cache');
  let artifacts = new Artifacts(config.repoCache, queue, index);

  // Clone and update cache...
  await repoCheckout(config, [
    workspace, args.url, args.manifest,
    '--namespace', args.namespace,
    '--branch', args.branch
  ]);

  // Get a list of the projects so we can build the tars...
  let projects = await vcsRepo.list(workspace);

  // Configs for the taskcluster helper functions
  let tcConfig = {
    taskId: args.taskId,
    runId: args.runId,
    namespace: args.namespace,
    branch: args.branch,
    expires: args.expires
  };

  await Promise.all(projects.map(async (project) => {
    let name = `${urlAlias(project.remote)}/${args.branch}`;
    let projectNamespace = `${args.namespace}.${createHash(name)}`;

    let projectPath =
      fsPath.join('.repo', 'projects', `${project.path}.git`);
    let objectsPath =
      fsPath.join('.repo', 'project-objects', `${project.name}.git`);

    await artifacts.createLocalArtifact(
      name, workspace, projectPath, objectsPath
    );

    if (args.upload) {
      await artifacts.indexAndUploadArtifact(name, projectNamespace, {
        taskId: args.taskId,
        runId: args.runId,
        expires: args.expires
      });
    }
  }));

  // Cleanup after ourselves...
  await run(`rm -Rf ${workspace}`);
}
