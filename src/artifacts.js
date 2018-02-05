import request from 'superagent-promise';
import run from './run';
import render from 'json-templater/string';
import fs from 'mz/fs';
import fsPath from 'path';
import denodeify from 'denodeify';
import mkdirp_ from 'mkdirp';
import assert from 'assert';
import ms from 'ms';

import { Index, Queue } from 'taskcluster-client';

let mkdirp = denodeify(mkdirp_);

/**
The logic if how artifacts are found and stored is kept here and utilized by
anything that needs to download an artifact (and find it via the index) or
utilize one cached locally.
*/
export default class Artifacts {

  /**
  @param {Object} config leaf for example the "repoCache" section from default_config.yml.
  @param {Object} [queue] taskcluster queue.
  @param {Object} [index] taskcluster queue.
  */
  constructor(config, queue, index) {
    this.config = config;
    this.queue = queue || new Queue();
    this.index = index || new Index();
  }

  nameToArtifact(name) {
    return `public/${name}.tar.gz`;
  }

  /**
  Find the path on disk where artifact would be kept.
  */
  lookupLocal(name) {
    let root = render(this.config.cacheDir, { env: process.env });
    return fsPath.join(
      root,
      render(this.config.cacheName, { name })
    );
  }

  /**
  Find an artifact via the index and return a url if found.
  */
  async lookupRemote(namespace, artifact) {
    let task;
    try {
      task = await this.index.findTask(namespace);
      if (task.message && task.message === 'Indexed task not found') {
        let error = new Error(task.message)
        error.code = 404;
        throw error;
      }
    } catch (e) {
      // 404 will throw so validate before returning null...
      if (e.code && e.code != 404){
        console.log(e.stack || e);
        throw e;
      } 
      console.error(
        `[taskcluster-vcs:warning] No task indexed for namespace "${namespace}"`
      );
      return null;
    }

    let artifactUrl = this.queue.buildUrl(
      this.queue.getLatestArtifact, task.taskId, artifact
    );

    let res = await request.head(artifactUrl).end();

    // If URL is a redirect, follow redirect and see if artifact exists
    if (res.status === 303) {
      let redirectRes = await request.get(artifactUrl).redirects(0).end();
      res = await request.head(redirectRes.headers.location).end();
    }

    // Either the artifact could not exist (404) or an artifact was not uploaded
    // entirely resulting in a 403.
    if ([403, 404].includes(res.status)) {
      console.error(
        `[taskcluster-vcs:error] Artifact "${artifact}" not found ` +
        `for task ID ${task.taskId}.  This could be caused by the artifact ` +
        'not being created or being marked as expired.'
      );
      return null;
    }

    return artifactUrl;
  }

  /**
  Find a possible cached archive and download if possible.
  */
  async downloadIfUnavailable(name, namespace, dest) {
    let localPath = this.lookupLocal(name);

    if (await fs.exists(localPath)) {
      return localPath;
    }

    let remoteUrl =
      await this.lookupRemote(namespace, this.nameToArtifact(name));

    if (!remoteUrl) return;

    await this.download(remoteUrl, localPath);

    return localPath;
  }

  /**
  Download url to localPath ensuring directories exist along the way.
  */
  async download(remoteUrl, localPath) {
    // Ensure directory exists...
    let dirname = fsPath.dirname(localPath);
    await mkdirp(dirname);
    let cmd = render(this.config.get, {
      url: remoteUrl,
      dest: localPath
    });

    try {
      await run(cmd, { retries: 20 });
    } catch(e) {
      console.log('[taskcluster-vcs:error] Error when downloading from remote url');
      console.log(e.stack || e);
      throw e;
    }
  }

  async upload(source, url) {
    assert(await fs.exists(source), `${source} must exist`);
    console.log('upload', source, url);
    let cmd = render(this.config.uploadTar, {
      source, url
    });
    await run(cmd, { retries: 10 });
  }

  /**
  Extract the tars!
  */
  async extract(source, dest) {
    await mkdirp(dest);
    assert(await fs.exists(source), `${source} must exist to extract...`);
    assert(dest, 'must pass dest...');
    let cmd = render(
      this.config.extract, {
      source,
      dest
    });

    try {
      await run(cmd);
    } catch(e) {
      console.error('[taskcluster-vcs:error] Error when extracting archive');
      console.log(e.stack || e);
      throw e;
    }

  }

  /**
  Note: This method _requires_ you to have created the local artifact first.
  */
  async indexAndUploadArtifact(name, namespace, options) {
    let localPath = this.lookupLocal(name);
    assert(
      await fs.exists(localPath),
      `Artifact (${localPath}) must exist locally first did you call createLocalArtifact?`
    );

    options = Object.assign({
      taskId: process.env.TASK_ID,
      runId: process.env.RUN_ID,
      // Task expiration is defaulted to 1 year from date of creation.
      // Make artifact expiration 1 day less than task expiration.
      expires: new Date(Date.now() + ms('364 days')),
      rank: Date.now()
    }, options);

    assert(options.taskId, 'must pass taskId');
    assert(options.runId, 'must pass runId');

    // hard code expiration
    options.expires = new Date(Date.now() + ms('364 days'));
    console.log('options.expires', options.expires);
    let artifact = await this.queue.createArtifact(
      options.taskId,
      options.runId,
      this.nameToArtifact(name),
      {
        storageType: 's3',
        expires: options.expires,
        contentType: 'application/x-tar'
      }
    );

    console.log('putUrl', artifact.puUrl);
    await this.upload(localPath, artifact.putUrl);

    await this.index.insertTask(namespace, {
      taskId: options.taskId,
      // Note: While we _can_ determine a few useful different ways of ranking a
      // single repository (number of commits, last date of commit, etc...) using
      // a simple Date.now + a periodic caching system is likely to yield better
      // results with similar amount of churn...
      rank: options.rank,
      data: {},
      expires: options.expires
    });
  }

  /**
  Given the name of an artifact create it locally (compressing files).

  @param {String} name of artifact.
  @param {String} cwd where to run compression (important for tar paths).
  @param {String} ...files to compress.
  @return {String} path to artifact.
  */
  async createLocalArtifact(name, cwd, ...files) {
    let path = this.lookupLocal(name);
    await mkdirp(fsPath.dirname(path));

    await Promise.all(files.map(async (file) => {
      let path = fsPath.join(cwd, file);
      assert(await fs.exists(path), `Missign file in artifact path (${path})`);
    }));

    let cmd = render(this.config.compress, {
      source: files.join(' '),
      dest: path
    });

    await run(cmd, { cwd });
    return path;
  }
}
