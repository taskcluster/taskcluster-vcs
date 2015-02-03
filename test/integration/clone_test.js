import rm from './rm';
import run from './run';
import fs from 'mz/fs';
import assert from 'assert';
import mkdirp from 'mkdirp';

suite('clone', function() {
  test('hg', async function() {
    let dest = `${this.home}/hg`;
    let out = await run([
      'clone',
      '--namespace=not-vcs-test',
      'https://bitbucket.org/lightsofapollo/hgtesting',
      dest
    ]);
    assert((await fs.exists(dest)), 'path exists');
    let rev = await run(['revision', dest]);
    assert.equal(rev[0], '5d3acb7ef08f1c988b6f34ade72718a10a6ac123');
  });

  test('git', async function () {
    let dest = `${this.home}/git`;
    await run([
      'clone',
      '--namespace=not-vcs-test',
      'https://bitbucket.org/lightsofapollo/gittesting',
      dest
    ]);
    assert((await fs.exists(dest)), 'path exists');
    let rev = await run(['revision', dest]);
    assert.equal(rev[0], '3d8bd58cddfa558b78e947ed04ad8f9a3359ed73');
  });

  test('cached', async function () {
    let home = this.home;
    let alias = 'github.com/lightsofapollo/tc-vcs-cache';
    let url = `https://${alias}`;
    await run(['create-clone-cache', url]);
    async function testCache (dest) {
      await run([
        'clone',
        url,
        dest
      ]);

      assert((await fs.exists(dest)), 'path exists');
      let rev = await run(['revision', dest]);
      let cachePath = `${home}/clones/${alias}.tar.gz`;
      assert.ok((await fs.exists(cachePath)), 'cache was correctly downloaded');
    }

    // Run and rerun the cache a few times to see what happens!
    await testCache(`${home}/cache-1`);
    await testCache(`${home}/cache-2`);
    await testCache(`${home}/cache-3`);
  });
});
