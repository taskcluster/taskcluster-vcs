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
import URL from 'url';
import { parseString as _parseXML } from 'xml2js';
import denodeify from 'denodeify';
import urljoin from 'url-join';

let parseXML = denodeify(_parseXML);

const TEMP_MANIFEST_NAME = '.tc-vcs-manifest';

async function resolveManifestPath(cwd, path) {
  if (URL.parse(path).protocol) return path;
  if (await fs.exists(path)) return path;
  return fsPath.join(cwd, path);
}

/**
Initialize the "repo" using a custom manifest...

This logic is mostly taken from what the config.sh command does inside of b2g.
*/
export async function init(config, cwd, manifest, opts={}) {
  opts = Object.assign({ branch: 'master' }, opts);
  manifest = await resolveManifestPath(cwd, manifest);

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
    let res = await request.get(manifest).buffer(true).end();
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

export async function resolveManifestIncludes(path, manifest, seen) {
  seen = seen || new Set();
  if (!manifest.include) return manifest;
  let dir = fsPath.dirname(path);

  // Only descendants of this node share seen... Inclusions are allowed multiple
  // times in the tree but nodes may not contain cyclic references.
  seen = new Set(seen)
  seen.add(path);

  // Resolve includes...
  await Promise.all(manifest.include.map(async function (v) {
    let include = v['$'];

    // Join and resolve the path to ensure we don't get tricked by relative
    // directories when doing our circular checks...
    let submanifestPath = fsPath.resolve(fsPath.join(dir, include.name));

    if (seen.has(submanifestPath)) {
      throw new Error(`Circular includes from: ${path} for ${include.name}`);
    }

    let submanifestContent = await fs.readFile(submanifestPath, 'utf8');
    let { manifest: submanifest } = await parseXML(submanifestContent);

    if (submanifest.include) {
      submanifest =
        await resolveManifestIncludes(submanifestPath, submanifest, seen);
    }

    if (submanifest.project) {
      manifest.project = manifest.project.concat(submanifest.project);
    }

    if (submanifest.remote) {
      manifest.remote = manifest.remote.concat(submanifest.remote);
    }
  }));

  return manifest;
}

/**
List the projects within a given repo manifest.

@param {Object} config for manifest.
@param {String} path to manifest.xml on disk.
*/
export async function listManifestProjects(path) {
  let content = await fs.readFile(path, 'utf8');
  let { manifest } = await parseXML(content);
  manifest = await resolveManifestIncludes(path, manifest);

  // For easier access create a dictionary of all the remotes...
  let remotes = manifest.remote.reduce((result, v) => {
    // root namespace...
    let remote = v['$'];
    result[remote.name] = remote;
    return result;
  }, {});

  let defaultRemote;
  // Find the default remote if available if there is no default then we must
  // throw an error if we encounter a project with a "remote"
  if (manifest['default']) {
    defaultRemote = manifest['default'][0]['$'];
    if (defaultRemote.remote) {
      defaultRemote.fetch = remotes[defaultRemote.remote].fetch;
    }
  }

  return manifest.project.map((v) => {
    let project = v['$'];
    if (!project) throw new Error('unknown or empty project...');
    if (!project.name) throw new Error('Project must have a name...');
    if (!project.path) throw new Error('Project must have a path...');

    let remote = remotes[project.remote] || defaultRemote;
    if (!remote) {
      throw new Error(`Project ${project.name || 'unknown'} has no remote.`);
    }

    if (!remote.fetch) {
      throw new Error(`${project.name}'s remote has no fetch.`);
    }

    return {
      name: project.name,
      path: project.path,
      revision: project.revision || remote.revision || 'master',
      remote: urljoin(remote.fetch, project.name)
    }
  });
}

/**
Generate list of all projects with path / name and remote.
*/
export async function list(config, cwd, opts={}) {
  let manifestPath = fsPath.join(cwd, '.repo', 'manifest.xml');
  if (!manifestPath) {
    throw new Error(`Cannot list projects without manifest ${manifestPath}`);
  }
  return await listManifestProjects(manifestPath);
}
