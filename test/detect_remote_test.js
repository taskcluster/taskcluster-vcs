import assert from 'assert';
import detect from '../src/vcs/detect_remote';


suite('detect', function() {
  async function check (baseUrl, type) {
    let [ssh, https] = await Promise.all([
      detect('ssh://' + baseUrl),
      detect('https://' + baseUrl)
    ])

    assert.equal(https.type, type, 'when given https://');
    assert.equal(ssh.type, type, 'when given ssh://');
  }

  test('hg - bit bucket', async function () {
    await check('bitbucket.org/lightsofapollo/hgtesting', 'hg');
  });

  test('hg - mozilla central', async function () {
    await check('hg.mozilla.org/mozilla-central', 'hg');
  });

  test('git - github', async function () {
    await check('github.com/mozilla-b2g/gaia', 'git');
  });

  test('git - mozilla-central', async function () {
    await check('git.mozilla.org/releases/gecko', 'git');
  });
});
