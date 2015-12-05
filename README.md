# TaskCluster VCS Tools (tc-vs)

[![Documentation Status](https://readthedocs.org/projects/tc-vcs/badge/?version=latest)](https://readthedocs.org/projects/tc-vcs/?badge=latest)

[![Build Status](https://travis-ci.org/taskcluster/taskcluster-vcs.svg?branch=master)](https://travis-ci.org/taskcluster/taskcluster-vcs)

[Read the docs](http://tc-vcs.readthedocs.org/en/latest/)

# Deploying new Docker images


```
# Edit `Dockerfile` and `src/task.js` to update the version number.
docker bulid -t taskcluster/taskcluster-vcs:$VERSION .
docker login
docker push taskcluster/taskcluster-vcs:$VERSION

```

# Deploying new versions on npm

Consider running `npm update` first and testing the result.

```
# Edit package.json to update the revision
npm shrinkwrap
npm login
npm publish
```

Don't forget to commit and push the changes.
