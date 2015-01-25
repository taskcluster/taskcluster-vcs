import { ArgumentParser } from 'argparse';
import detect from '../vcs/detect_remote';
import run from '../vcs/run';
import render from 'json-templater/string';
import request from 'superagent-promise';
import _mkdirp from 'mkdirp';
import fs from 'mz/fs';
import fsPath from 'path';
import urlJoin from 'url-join';
import denodeify from 'denodeify';
import URL from 'url';

let mkdirp = denodeify(_mkdirp);

/**
Determines if the clone has a cache if it does return a url do it.
*/
async function getCloneCache(config, url) {
  // normalize the url to the "name"
  let components = URL.parse(url);
  let cacheName = render(
    config.cloneCache.cacheName,
    { name: urlJoin(components.host, components.pathname) }
  )

  let cacheUrl = render(config.cloneCache.baseUrl, {
    cacheName: cacheName
  });

  let res = await request.head(cacheUrl).end();
  if (!res.ok) {
    return null;
  }

  let cacheDir = render(config.cloneCache.cacheDir, {
    env: process.env
  });

  return {
    url: cacheUrl,
    dest: fsPath.join(cacheDir, cacheName)
  };
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

  await run('/bin/bash', ['-c', cmd]);
  return await cacheExtract(config, cache.dest, dest);
}

async function cacheExtract(config, source, dest) {
  let cmd = render(config.cloneCache.extract, {
    source: source,
    dest: dest
  });

  await mkdirp(dest);
  return await run('/bin/bash', ['-c', cmd]);
}

export default async function main(config, argv) {
  let parser = new ArgumentParser({
    prog: 'tc-vcs clone',
    version: require('../../package').version,
    addHelp: true,
    description: 'issue clone to correct vcs type'
  });

  parser.addArgument(['url'], {
    help: 'url which to clone from',
  });

  parser.addArgument(['dest'], {
    help: 'destination of clone'
  });

  let args = parser.parseArgs(argv);
  let cache = await getCloneCache(config, args.url);

  if (cache) {
    return await useCache(config, cache, args.dest);
  }

  return await useClone(config, args.url, args.dest);
}
