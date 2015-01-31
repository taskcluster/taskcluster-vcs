import { parseString as _parseString } from 'xml2js';
import fs from 'mz/fs';
import vcsRepo from '../../src/vcs/repo';
import denodeify from 'denodeify';
import assert from 'assert';

let parseString = denodeify(_parseString);

suite('vcs/repo', function() {
  function fixture(name, type) {
    return `${__dirname}/fixtures/${name}.${type}`;
  }

  suite('#listManifestProjects', function() {
    test('b2g.xml', async function() {
      // This file contains defaults and multiple remotes...
      let result = await vcsRepo.listManifestProjects(fixture('b2g', 'xml'));
      assert.deepEqual(require(fixture('b2g', 'json')), result);
    });
  });
});
