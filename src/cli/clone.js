import { ArgumentParser } from 'argparse';
import detect from '../vcs/detect_remote';
import run from '../vcs/run';
import render from 'json-templater/string';
import _mkdirp from 'mkdirp';
import fs from 'mz/fs';
import fsPath from 'path';
import denodeify from 'denodeify';
import createHash from '../hash';
import urlAlias from '../vcs/url_alias';

let mkdirp = denodeify(_mkdirp);

import { Index, Queue } from 'taskcluster-client';

// Used in read only fashion so no need to wait to construct...
let queue = new Queue();
let index = new Index();

/**
Determines if the clone has a cache if it does return a url do it.
*/
async function getCloneCache(config, namespace, url) {
  // normalize the url to the "name"
  let alias = urlAlias(url);
  let cacheName = render(
    config.cloneCache.cacheName,
    { name: alias }
  );

  let namespace = `${namespace}.${createHash(alias)}`;
  let task;

  try {
    task = await index.findTask(namespace);
  } catch (e) {
    // 404 will throw so validate before returning null...
    if (e.code && e.code != 404) throw e;
    return null;
  }

  let cacheUrl = queue.buildUrl(queue.getLatestArtifact,
    task.taskId,
    `public/${alias}.tar.gz`
  );

  let cacheDir = render(config.cloneCache.cacheDir, {
    env: process.env
  });

  return {
    url: cacheUrl,
    dest: fsPath.join(cacheDir, cacheName)
  }

}

async function useClone(config, source, dest) {
  let vcsConfig = await detect(source);
  let module = require('../vcs/' + vcsConfig.type);
  let clone = new module.Clone(config);
  return await clone.run(source, dest);
}

async function useCache(config, cache, dest) {
  // Mimic the behaviours of git/hg and do not allow users to clobber
  // themselves accidentally.
  if (await fs.exists(dest)) {
    throw new Error('Cannot extract to existing directory ' + dest);
  }

  await mkdirp(fsPath.dirname(cache.dest))

  // We are lazy and do not re-download anything that has been downloaded at
  // any point in the past.
  if (await fs.exists(cache.dest)) {
    // Extract the already downloaded cache...
    return await cacheExtract(config, cache.dest, dest);
  }

  return await downloadAndExtractCache(config, cache, dest);
}

async function downloadAndExtractCache(config, cache, dest) {
  let cmd = render(config.cloneCache.get, {
    url: cache.url,
    dest: cache.dest
  });

  await run(cmd);
  return await cacheExtract(config, cache.dest, dest);
}

async function cacheExtract(config, source, dest) {
  let cmd = render(config.cloneCache.extract, {
    source: source,
    dest: dest
  });

  await mkdirp(dest);
  return await run(cmd);
}

export default async function main(config, argv) {
  let parser = new ArgumentParser({
    prog: 'tc-vcs clone',
    version: require('../../package').version,
    addHelp: true,
    description: `
      Clones the given repository automatically detecting the vcs type based on
      the remote url. This command will always favor the cache over directly
      hitting the remote url meaning the clone may be older then the current
      state of the repository (use checkout-revision to update it).
    `.trim()
  });

  parser.addArgument(['--namespace'], {
    defaultValue: 'tc-vcs.v1.clones',
    help: `
      Namespace under Index to query should match the value set in
      create-clone-cache.
    `.trim()
  });

  parser.addArgument(['url'], {
    help: 'url which to clone from',
  });

  parser.addArgument(['dest'], {
    help: 'destination of clone'
  });

  let args = parser.parseArgs(argv);
  let cache = await getCloneCache(config, args.namespace, args.url);
  if (cache) {
    return await useCache(config, cache, args.dest);
  }

  return await useClone(config, args.url, args.dest);
}
