suite('detect', function() {
  var assert = require('assert');
  var detect = require('../src/vcs/detect_remote');
  var co = require('co');

  function* check (baseUrl, type) {
    var results = yield {
      ssh: detect('ssh://' + baseUrl),
      https: detect('https://' + baseUrl)
    };

    assert.equal(results.https.type, type, 'when given https://');
    assert.equal(results.ssh.type, type, 'when given ssh://');
  }

  test('hg - bit bucket', co(function* () {
    yield check('bitbucket.org/lightsofapollo/hgtesting', 'hg');
  }));

  test('hg - mozilla central', co(function* () {
    yield check('hg.mozilla.org/mozilla-central', 'hg');
  }));

  test('git - github', co(function* () {
    yield check('github.com/mozilla-b2g/gaia', 'git');
  }));

  test('git - mozilla-central', co(function* () {
    yield check('git.mozilla.org/releases/gecko', 'git');
  }));

});
