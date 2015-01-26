# Caching

Note: This requires knowledge of both the taskcluster index api and
artifacts.

Aside from the benefits of unified commands for hg/git heavy use of
caches is the other goal of tc-vcs. Often times in a CI type environment
various types of vcs operations are repeated (sometime many many times)
tc-vcs can make these operations very cheap and fast depending on how
you leverage the caches.

## Remote caching

The best form of caching provided by `tc-vcs` is the full clone cache
which is stored as a task artifact in taskcluster and then indexed.
Refer to the [clone namespace algorithm](#the-clone-namespace-algorithm) for how that is constructed.

The `tc-vcs` cli can easily create the caches for you (best to use as
a task within docker worker)

```sh
# This assumes you are creating a cache via the docker-worker with the
# taskclusterProxy feature enabled...
tc-vcs create-clone-cache --task-id $TASK_ID --run-id $RUN_ID --proxy $URL
```

In addition the cli a [docker image](https://registry.hub.docker.com/u/taskcluster/taskcluster-vcs/) is available for use.

Here is an example task which caches gaia (note you should update
deadline/created and use a tag other then latest for best results).

Remember that `scopes` are required to upload the artifact and index
below is a very permissive example...

```js
{
  "provisionerId": "aws-provisioner",
  "workerType": "gaia",
  "created": "2015-01-26T07:36:58.927Z",
  "deadline": "2015-01-26T08:36:58.927Z",
  "scopes": [
    "queue:*",
    "index:*"
  ],
  "payload": {
    "image": "taskcluster/taskcluster-vcs:latest",
    "command": [
      "https://github.com/mozilla-b2g/gaia"
    ],
    "maxRunTime": 3600,
    "features": {
      "taskclusterProxy": true
    }
  },
  "metadata": {
    "name": "cache",
    "description": "cache",
    "owner": "<owner>",
    "source": "<source>"
  }
}
```

### The clone namespace algorithm

Given a url of `https://github.com/mozilla-b2g/gaia` strip the protocol
from the string leaving 'github.com/mozilla/gaia' (the 'url alias') take
the url alias and hash with md5. The namespace is:

```
tc-vcs.v1.clones.${md5('github.com/mozilla-b2g/gaia')}
```

## User directory caching

The `$HOME/.tc-vcs/` folder contains copies of the remote caches
(which are usually a tarball of some kind) this allows clone operations
to transparently optimize away the (normally) largest and slowest
operation you will run.

Aside from performance this allows you to use a "clean slate" (a fresh
clone usually) for each clone operation with minimal overhead.
