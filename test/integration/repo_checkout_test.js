import rm from './rm';
import run from './run';
import fs from 'mz/fs';
import fsPath from 'path';
import assert from 'assert';
import mkdirp from 'mkdirp';

suite('repo-checkout', function() {
  // This test is slow and network bound!
  this.timeout('80s');

  let url = 'https://github.com/taskcluster/tc-vcs-repo-test';
  let dest;
  setup(function() {
    dest = `${this.home}/test`
  });

  test('successful repo sync', async function () {
    let manifest = 'sources.xml';
    await run([
      'repo-checkout', '--force-clone', dest, url, manifest
    ]);

    let [rev] = await run(['revision', `${dest}/gittesting`]);
    assert.equal(rev, '3d8bd58cddfa558b78e947ed04ad8f9a3359ed73');
  });

  test('(cached) repo sync and resync', async function() {
    let manifest = 'sources.xml';
    let home = this.home;
    // create-repo-cache does not create a cache of the original repo that contains
    // the source manifest so later calling repo-checkout without force-clone causes
    // all sorts of issues
    await run(['create-clone-cache', '--force-clone', url]);
    await run(['create-repo-cache', '--force-clone', url, manifest]);


    let force = false
    async function checkout() {
      await run(['repo-checkout', dest, url, manifest]);
      let statsUrl = fsPath.join(dest, '.repo', '.tc-vcs-cache-stats.json');

      let alias = 'bitbucket.org/lightsofapollo/gittesting/master';
      let cachePath = `${home}/repo/sources/${alias}.tar.gz`;
      assert.ok(await fs.exists(cachePath), 'cache exists...');

      let [rev] = await run(['revision', `${dest}/gittesting`]);
      assert.equal(rev, '3d8bd58cddfa558b78e947ed04ad8f9a3359ed73');

      assert.ok(
        await fs.existsSync(statsUrl),
        'uses cache'
      );

      let cache = require(statsUrl);
      assert.ok(cache.projects['gittesting']);
    }

    await checkout();
    await checkout();
  });
})
