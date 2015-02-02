import { parseString as _parseString } from 'xml2js';
import fs from 'mz/fs';
import vcsRepo from '../../src/vcs/repo';
import denodeify from 'denodeify';
import assert from 'assert';
import run from '../integration/run'

let parseString = denodeify(_parseString);

suite('vcs/repo', function() {
  function fixture(name, type) {
    return `${__dirname}/fixtures/${name}.${type}`;
  }

  suite('#init', function() {
    test('remote clone multi manifest (include tags)', async function() {
      let url = 'https://github.com/taskcluster/tc-vcs-repo-test';
      let manifest = 'https://raw.githubusercontent.com/taskcluster/tc-vcs-repo-test/master/includes.xml';
      let dir = `${this.home}/test`;

      // cheat by checking out the repository
      await run(['checkout', dir, url]);
      await vcsRepo.init(dir, manifest);
      await vcsRepo.sync(dir);
    });

    test('local clone multi manifest (include tags)', async function() {
      let url = 'https://github.com/taskcluster/tc-vcs-repo-test';
      let dir = `${this.home}/test`;

      // cheat by checking out the repository
      await run(['checkout', dir, url]);
      await vcsRepo.init(dir, `${dir}/includes.xml`);
      await vcsRepo.sync(dir);
    });
  });

  suite('#listManifestProjects', function() {
    test('b2g.xml', async function() {
      // This file contains defaults and multiple remotes...
      let result = await vcsRepo.listManifestProjects(fixture('b2g', 'xml'));
      assert.deepEqual(require(fixture('b2g', 'json')), result);
    });

    test('remove_project.xml', async function() {
      // This file contains defaults and multiple remotes...
      let result = await vcsRepo.listManifestProjects(fixture('remove_project', 'xml'));
      assert.deepEqual(require(fixture('remove_project', 'json')), result);
    });

    test('b.xml', async function() {
      // Two files with includes...
      let result = await vcsRepo.listManifestProjects(fixture('b', 'xml'));
      assert.deepEqual(require(fixture('b', 'json')), result);
    });
  });
});
