import run from './vcs/run';
import render from 'json-templater/string';
import fs from 'mz/fs';
import fsPath from 'path';

import { Index, Queue } from 'taskcluster-client';

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
    } catch (e) {
      // 404 will throw so validate before returning null...
      if (e.code && e.code != 404) throw e;
      return null;
    }

    return this.queue.buildUrl(
      this.queue.getLatestArtifact, task.taskId, artifact
    );
  }

  /**
  Find and extract an artifact if possible returns true if one is
  found/extracted false otherwise...
  */
  async useIfAvailable(name, namespace, dest) {
    let localPath = this.lookupLocal(name);
    if (await fs.exists(localPath)) {
      await this.extract(localPath, dest);
      return true;
    }

    let remoteUrl =
      await this.lookupRemote(namespace, this.nameToArtifact(name));

    if (!remoteUrl) {
      return false;
    }

    await this.download(remoteUrl, localPath);
    await this.extract(localPath, dest);
  }

  /**
  Download url to localPath ensuring directories exist along the way.
  */
  async download(remoteUrl, localPath) {
    // Ensure directory exists...
    let dirname = fsPath.dirname(localPath);
    await mkdirp(dirname);
    await run(render(this.config.get, {
      url: remoteUrl,
      dest: localPath
    }));
  }

  /**
  Extract the tars!
  */
  async extract(source, dest) {
    await run(render(this.config.extract, {
      source,
      dest
    }));
  }
}
