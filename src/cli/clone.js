'use strict';

var ArgumentParser = require('argparse').ArgumentParser;
var Promise = require('promise');
var detect = require('../vcs/detect_remote');
var run = require('../vcs/run');
var render = require('json-templater/string');
var request = require('superagent-promise');
var mkdirp = Promise.denodeify(require('mkdirp'));
var fs = require('mz/fs');
var fsPath = require('path');
var urlJoin = require('url-join');
var URL = require('url');

/**
Determines if the clone has a cache if it does return a url do it.
*/
function hasCloneCache(config, url) {
  // normalize the url to the "name"
  var components = URL.parse(url);
  var cacheName = render(
    config.cloneCache.cacheName,
    { name: urlJoin(components.host, components.pathname) }
  )

  var cacheUrl = render(config.cloneCache.baseUrl, {
    cacheName: cacheName
  });

  return request.head(cacheUrl).end().then(function(res) {
    if (res.ok) {
      var cacheDir = render(config.cloneCache.cacheDir, {
        env: process.env
      });

      return {
        url: cacheUrl,
        dest: fsPath.join(cacheDir, cacheName)
      };
    }
    return null;
  });
}

function useClone(config, source, dest) {
  return detect(source)
    .then(function(vcsConfig) {
      var module = require('../vcs/' + vcsConfig.type);
      var clone = new module.Clone(config);
      return clone.run(source, dest);
    })
}

function useCache(config, cache, dest) {
  // For efficiency we keep a cache of all downloaded dependencies the structure
  // used closely mirrors to what we use on the server.
  return fs.exists(dest).
    then(function(hasDest) {
      // Mimic the behaviours of git/hg and do not allow users to clobber
      // themselves accidentally.
      if (hasDest) {
        throw new Error('Cannot extract to existing directory ' + dest);
      }
      return mkdirp(fsPath.dirname(cache.dest))
    })
    .then(function() {
      return fs.exists(cache.dest)
    })
    .then(function(hasCacheDest) {
      // We are lazy and do not re-download anything that has been downloaded at
      // any point in the past.
      if (hasCacheDest) {
        // Extract the already downloaded cache...
        return cacheExtract(config, cache.dest, dest);
      }
      return downloadAndExtractCache(config, cache, dest);
    })
}

function downloadAndExtractCache(config, cache, dest) {
  var cmd = render(config.cloneCache.get, {
    url: cache.url,
    dest: cache.dest
  });

  return run('/bin/bash', ['-c', cmd]).
    then(function() {
      return cacheExtract(config, cache.dest, dest);
    });
}

function cacheExtract(config, source, dest) {
  var cmd = render(config.cloneCache.extract, {
    source: source,
    dest: dest
  });

  return mkdirp(dest)
    .then(function() {
      return run('/bin/bash', ['-c', cmd]);
    });
}

module.exports = function main(config, argv) {
  var parser = new ArgumentParser({
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

  var args = parser.parseArgs(argv);
  return hasCloneCache(config, args.url)
    .then(function(cache) {
      if (cache) {
        return useCache(config, cache, args.dest);
      }
      return useClone(config, args.url, args.dest);
    })
    .catch(function(e) {
      process.nextTick(function() {
        throw e;
      });
    });
}
