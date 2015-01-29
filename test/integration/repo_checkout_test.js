import rm from './rm';
import run from './run';
import fs from 'mz/fs';
import assert from 'assert';
import mkdirp from 'mkdirp';

suite('repo-checkout', function() {
  let url = 'https://github.com/taskcluster/tc-vcs-repo-test';
  let dest = __dirname + '/clones/repo';

  async function clean() {
    await rm('./clones/');
    mkdirp.sync(__dirname + '/clones');
  }

  teardown(clean);
  setup(clean);

  test('successful repo sync', async function () {
    await run([
      'repo-checkout', '-c', `./config.sh do sources.xml`, dest, url
    ]);

    let [rev] = await run(['revision', `${dest}/gittesting`]);
    assert.equal(rev, '3d8bd58cddfa558b78e947ed04ad8f9a3359ed73');
    console.log(rev);
  });
})
