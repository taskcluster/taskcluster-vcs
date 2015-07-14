import run from '../run';

let REMOTE = 'tc-vcs-remote';

/*
 * Return the ref remote name if it exists, otherwise
 * returns REMOTE.
 */
async function getRefRemote(config, cwd, ref) {
  let [stdout] = await run(`${config.git} branch -r`, {
    cwd,
    raiseError: false,
    verbose: false,
    buffer: true
  });

  // branches contains the list of all remote refs
  let branches = stdout.split('\n');
  for (var i in branches) {
    let branch = branches[i].trim();
    // If our ref is there and it is not the <remote>/HEAD -> <ref> line
    if (branch.indexOf(ref) != -1 && branch.indexOf('HEAD') == -1) {
      let remote = branch.split('/')[0];
      return remote;
    }
  }

  return REMOTE;
}

export async function clone(config, source, dest) {
  return await run(`${config.git} clone ${source} ${dest}`, {
    retries: 1
  });
}

export async function revision(config, cwd) {
  let [stdout] = await run(
    `${config.git} rev-parse HEAD`,
    {
      cwd,
      verbose: false,
      buffer: true
    }
  );
  return stdout.trim();
}

export async function checkoutRevision(config, cwd, repository, ref, rev) {
  let remote = await getRefRemote(config, cwd, ref);
  // The remote must exist, so we add it and ignore the error if it already exists.
  await run(`${config.git} remote add ${remote} ${repository}`, {
    cwd,
    raiseError: false
  });
  try {
    await run(`${config.git} fetch -f ${repository} ${ref}:refs/remotes/${remote}/${ref}`, {
      cwd,
      retries: 1
    });
  } catch (err) {
    // if ref == rev, we assume that's the revision number
    if (ref !== rev) {
      throw err;
    }
  }
  await run(`${config.git} reset --hard`, { cwd });
  await run(`${config.git} checkout ${rev}`, { cwd });
}

/**
Fetch all configs from a git repo...
*/
async function getConfig(config, cwd) {
  let [stdout] = await run(
    `${config.git} config --list`,
    { cwd, verbose: false, buffer: true }
  );

  // Parse the git config list into key/value pairs...
  return stdout.trim().split('\n').reduce((result, v) => {
    let assignment = v.indexOf('=');
    if (assignment === -1) return result;
    let name = v.slice(0, assignment);
    let value = v.slice(assignment + 1);
    result[name] = value;
    return result;
  }, {});
}

export async function remoteUrl(config, cwd) {
  let [branch, gitConfig] = await Promise.all([
    branchName(config, cwd),
    getConfig(config, cwd)
  ]);

  // If this is tracked branch this is explicit...
  let trackingRemote = gitConfig[`branch.${branch}.remote`];
  if (trackingRemote) {
    return gitConfig[`remote.${trackingRemote}.url`];
  }

  // Otherwise more like guess work...
  let [remotes] = await run(
    'git remote', { cwd, buffer: true, verbose: false }
  );
  let [remote] = remotes.trim().split('\n');
  if (!remote) {
    throw new Error(`Could not detect remote url for: : "${cwd}"`)
  }
  return gitConfig[`remote.${remote}.url`];
}

export async function branchName(config, cwd) {
  let [stdout] = await run(`${config.git} rev-parse --abbrev-ref HEAD`, {
    cwd,
    verbose: false,
    buffer: true
  });
  return stdout.trim();
}
