import run from './run';

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

export async function remoteUrl(config, cwd) {
  let [stdout] = await run(
    `${config.git} config --get remote.origin.url`,
    { cwd, verbose: false, buffer: true }
  );
  return stdout.trim();
}

export async function branchName(config, cwd) {
  let [stdout] = await run(`${config.git} rev-parse --abbrev-ref HEAD`, {
    cwd,
    verbose: false,
    buffer: true
  });
  return stdout.trim();
}
