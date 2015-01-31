/**
This module deals with the `git-repo` tool from android do not get confused
about what `repo` means often below in the comments `the repo command` will be
used to refer explicitly to this tool.
*/

import assert from 'assert';
import fsPath from 'path';
import run from './run';
import request from 'superagent-promise';
import fs from 'mz/fs';
import git from './git';

const TEMP_MANIFEST_NAME = '.tc-vcs-manifest';

/**
Initialize the "repo" using a custom manifest...

This logic is mostly taken from what the config.sh command does inside of b2g.
*/
export async function init(config, cwd, manifest, opts={}) {
  opts = Object.assign({ branch: 'master' }, opts);

  assert(await fs.exists(cwd), 'Must be run on an existing directory');

  // Ensure the "repo" binary is available...
  let repoPath = fsPath.join(cwd, 'repo');
  assert(await fs.exists(repoPath), `${repoPath} must exist`);

  // Create the ghetto temp manifest thing.
  let manifestRepo = fsPath.join(cwd, TEMP_MANIFEST_NAME);
  if (await fs.exists(manifestRepo)) {
    await run(`rm -Rf ${manifestRepo}`);
  }

  // Commit the manifest to the temp repo ... The repo command expects the
  // manifest to be inside of a git repository so we must place it there then
  // pass the local repository for the repo command to do it's thing.
  await run(`git init ${manifestRepo}`);

  let manifestContent;
  if (await fs.exists(manifest)) {
    // If the manifest exists on the local system...
    manifestContent = await fs.readFile(manifest, 'utf8');
  } else {
    // Otherwise try over http...
    let res = await requst.get(manifest).buffer(true).end();
    if (res.error) throw res.error;
    manifestContent = res.text;
  }

  // Do the git commit dance...
  await fs.writeFile(
    fsPath.join(manifestRepo, 'manifest.xml'), manifestContent
  );
  await run('git add manifest.xml', { cwd: manifestRepo });
  await run('git commit -m manifest', { cwd: manifestRepo });
  await run(`git branch -m ${opts.branch}`, { cwd: manifestRepo });

  // Initialize the manifests...
  //await run(`rm -Rf .repo/manifest*`);
  await run(
    `./repo init -b ${opts.branch} -u ${manifestRepo} -m manifest.xml`, 
    { cwd }
  );
}

export async function sync(config, cwd, opts={}) {
  opts = Object.assign({
    concurrency: 100
  }, opts);

  assert(await fs.exists(cwd), 'Must be run on an existing directory');

  // Ensure the "repo" binary is available...
  let repoPath = fsPath.join(cwd, 'repo');
  assert(await fs.exists(repoPath), `${repoPath} must exist`);
  await run(`./repo sync -j${opts.concurrency}`, { cwd });
}

/**
Generate list of all projects with path / name and remote.
*/
export async function list(config, cwd, opts={}) {
  // Why??? Mainly to avoid parsing xml of manifest.
  let [rawList] = await run(
    './repo list', { cwd, buffer: true, verbose: false }
  );

  return await Promise.all(rawList.trim().split('\n').map(async (line) => {
    let [path, name] = line.split(':');
    let remote = await git.remoteUrl(config, fsPath.join(cwd, path.trim()));
    // Do we want to consider adding the branch here?
    return {
      path: path.trim(),
      name: name.trim(),
      remote
    };
  }));
}
