import run from './run';

export async function clone(config, source, dest) {
  return await run(`${config.hg} clone ${source} ${dest}`);
}

export async function revision(config, cwd) {
  let [stdout] = await run(`${config.hg} parent --template {node}`, {
    buffer: true,
    cwd,
    verbose: false
  });

  return stdout.trim();
}

export async function checkoutRevision(config, cwd, repository, ref, revision) {
  await run(`${config.hg} pull -r ${revision} ${repository}`, { cwd });
  await run(`${config.hg} update -C ${revision}`, { cwd });
}

export async function remoteUrl(config, cwd) {
  let [stdout] = await run(`${config.hg} paths default`, {
    cwd,
    buffer: true,
    verbose: false
  });
  return stdout.trim();
}

export async function branchName(config, cwd) {
  let [stdout, stderr] = await run(`${config.hg} branch`, {
    cwd,
    buffer: true,
    verbose: false
  });
  return stdout.trim();
}
