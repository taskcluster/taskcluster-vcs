import run from '../run';

export async function clone(config, source, dest) {
  return await run(`${config.git} clone ${source} ${dest}`);
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
  await run(`${config.git} fetch ${repository} ${ref}`, { cwd });
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
