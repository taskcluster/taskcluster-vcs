import rm from './rm';
import run from './run';
import fs from 'mz/fs';
import fsPath from 'path';
import assert from 'assert';
import mkdirp from 'mkdirp';
import repoCache from './repo_cache';

suite('repo-checkout', function() {
  // This test is slow and network bound!
  this.timeout('80s');

  let url = 'https://github.com/taskcluster/tc-vcs-repo-test';
  let dest = __dirname + '/clones/repo';

  async function clean() {
    await rm('./clones/');
    mkdirp.sync(__dirname + '/clones');
  }

  teardown(clean);
  setup(clean);

  test('successful repo sync', async function () {
    let manifest = 'sources.xml';
    await run([
      'repo-checkout', '-m', manifest, dest, url
    ]);

    let [rev] = await run(['revision', `${dest}/gittesting`]);
    assert.equal(rev, '3d8bd58cddfa558b78e947ed04ad8f9a3359ed73');
  });

  test('(cached) repo sync and resync', async function() {
    let manifest = 'sources.xml';
    let [namespace, taskId] = await repoCache(url, manifest);

    async function checkout() {
      await run([
        'repo-checkout',
        '--namespace', namespace,
        '-m', manifest, dest, url
      ]);

      let statsUrl = fsPath.join(dest, '.repo', '.tc-vcs-cache-stats.json');

      let alias = 'bitbucket.org/lightsofapollo/gittesting/master';
      let cachePath = `${__dirname}/../cache/repo/sources/${alias}.tar.gz`;
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
