var URL = require('url');
var request = require('superagent-promise');
var urlJoin = require('url-join');

var Promise = require('promise');

/**
-> <url>?cmd=lookup&key=0 (if this is hg content-type will contain "mercurial")
-> 
*/

/**
Attempt to determine if this url is a git url.

See https://github.com/git/git/blob/398dd4bd039680ba98497fbedffa415a43583c16/Documentation/technical/http-protocol.txt#L199

For the exact logic used here...
*/
function detectGit(url) {
  var location = urlJoin(url, '/info/refs?service=git-upload-pack');

  var req = request.head(location)

  // Trick github/etc... Into thinking we are are a git client.
  req.set('User-Agent', 'git/2.0.1');

  return req.end().then(function(res) {
    if (res.error) throw res.error;
    if (res.headers['content-type'].indexOf('x-git') !== -1) {
      return { type: 'git', url: url };
    }
    throw new Error(url + ' is not a git url');
  });
}

function detectHg(url) {
  var location = urlJoin(url, '?cmd=lookup&key=0');

  return request.head(location).end().then(function(res) {
    if (res.error) throw res.error;
    if (res.headers['content-type'].indexOf('mercurial') !== -1) {
      return { type: 'hg', url: url };
    }
    throw new Error(url + ' is not a hg url');
  });
}

function firstSuccess(promises) {
  return new Promise(function(accept, reject) {
    var err;
    var pending = promises.length;

    promises.forEach(function(p) {
      p.then(accept, function(_err) {
        err = _err;
        if (--pending === 0) reject(err);
      });
    });
  });
}

function detect(url) {
  var components = URL.parse(url);

  // In the case of ssh endpoint convert to https which in most cases will
  // also work but provide an api which we can query...
  if (components.protocol === 'ssh:') {
    components.protocol = 'https:'
  }

  location = URL.format(components);

  // Now we race for the _first_ successful response otherwise we throw an
  // error.
  return firstSuccess([
    detectHg(location),
    detectGit(location)
  ]);
}

module.exports = detect;
