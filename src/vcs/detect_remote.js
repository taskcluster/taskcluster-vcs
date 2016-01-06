import URL from 'url';
import request from 'superagent-promise';
import urlJoin from 'url-join';

const BITBUCKET_API_PREFIX = 'https://api.bitbucket.org/1.0/repositories';

/*
 * Determine if a given URL is a bitbucket url
 */
function isBitbucketRepo(url) {
  return URL.parse(url).hostname === 'bitbucket.org';
}

/*
 * Assert that a given url for a bitbucket repo is the expected VCS type.
 */
async function assertBitbucketRepoType(url, expectedType) {
  let parsedUrl = URL.parse(url);
  let apiUrl =  urlJoin(BITBUCKET_API_PREFIX, parsedUrl.path);
  // Requesting the repository using the bitbucket API returns back a JSON payload
  // containing the scm type (either hg or git)
  let res = await request.get(apiUrl).end();

  if (res.error) throw res.error;

  if (res.body.scm !== expectedType) {
    throw new Error(`${url} is not a ${expectedType} url`);
  }

  return {type: expectedType, url: url};
}

/**
Attempt to determine if this url is a git url.

See https://github.com/git/git/blob/398dd4bd039680ba98497fbedffa415a43583c16/Documentation/technical/http-protocol.txt#L199

For the exact logic used here...
*/
async function detectGit(url) {
  // If repository is a bitbucket hosted repo, rely on SCM json information for
  // determining repository type.  content_type cannot be relied upon.
  if (isBitbucketRepo(url)) {
    return await assertBitbucketRepoType(url, 'git');
  }

  let location = urlJoin(url, '/info/refs?service=git-upload-pack');

  // XXX: get is used so we correctly follow redirects...
  let req = request.get(location);

  // Trick github/etc... Into thinking we are are a git client.
  req.set('User-Agent', 'git/2.0.1');
  req.buffer(false);

  let res = await req.end();
  if (res.error) throw res.error;
  if (
    res.headers['content-type'] &&
    res.headers['content-type'].indexOf('x-git') !== -1
  ) {
    // XXX: Because this is a "get" request we abort here to ensure we only
    // fetch the data we needed then stop closely after...
    res.req.abort();
    return { type: 'git', url: location };
  }
  throw new Error(url + ' is not a git url');
}

async function detectHg(url) {
  // If repository is a bitbucket hosted repo, rely on SCM json information for
  // determining repository type.  content_type cannot be relied upon.
  if (isBitbucketRepo(url)) {
    return await assertBitbucketRepoType(url, 'hg');
  }

  let location = urlJoin(url, '?cmd=lookup&key=0');

  console.log(`[taskcluster-vcs] detectHg: start fetching head of ${url}`);

  let res = await request.head(location).end();

  console.log(`[taskcluster-vcs] detectHg: end fetching head of ${url}`);

  if (res.error) throw res.error;
  let contentType = res.headers['content-type'];

  // we must have a content type and it must contain mercurial
  if (contentType && contentType.includes('mercurial')) {
    return { type: 'hg', url: location };
  }
  throw new Error(url + ' is not a hg url');
}

function firstSuccess(promises) {
  return new Promise(function(accept, reject) {
    let err;
    let pending = promises.length;

    promises.forEach(function(p) {
      p.then(accept, function(_err) {
        err = _err;
        if (--pending === 0) reject(err);
      });
    });
  });
}

export default async function detectRemote(url) {
  let components = URL.parse(url);

  // In the case of ssh endpoint convert to https which in most cases will
  // also work but provide an api which we can query...
  if (components.protocol === 'ssh:') {
    components.protocol = 'https:'
  }

  let location = URL.format(components);

  // Now we race for the _first_ successful response otherwise we throw an
  // error.
  return await firstSuccess([
    detectHg(location),
    detectGit(location)
  ]);
}
