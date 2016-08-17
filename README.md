# TaskCluster VCS Tools (tc-vs)

[![Documentation Status](https://readthedocs.org/projects/tc-vcs/badge/?version=latest)](https://readthedocs.org/projects/tc-vcs/?badge=latest)

[![Build Status](https://travis-ci.org/taskcluster/taskcluster-vcs.svg?branch=master)](https://travis-ci.org/taskcluster/taskcluster-vcs)

[Read the docs](http://tc-vcs.readthedocs.org/en/latest/)

# Deploying new Docker images


```
# Edit `Dockerfile` and `src/cli/moz-cache.js` to update the version number.
docker build -t taskcluster/taskcluster-vcs:$VERSION .
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

# Post-Deployment Verification

After publishing a new version to npm and deploying a new docker image with that version, the image and version can be tested by duplicating the tc-vcs TaskCluster hook and replacing the image version number with the newly created version.  Run the task and ensure the tasks that it schedules complete successfully.  At a minimum tasks for hg, git, and android repo clones should be tested.
