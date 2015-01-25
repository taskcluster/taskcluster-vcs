import run from './run';
import { exec } from 'mz/child_process';
import Command from './command';

function runGit(git, cwd, commands, opts) {
  opts = Object.assign({ cwd: cwd }, opts);
  opts.env = Object.assign({}, process.env, opts.env);
  return run(git, commands, opts);
}

export class Clone extends Command {
  async run(source, dest) {
    return await run(this.config.git, ['clone', source, dest]);
  }
}

export class Revision extends Command {
  async run(source) {
    let [stdout] = await exec(
      [this.config.git, 'rev-parse', 'HEAD'].join(' '),
      { cwd: source, env: process.env }
    );
    return stdout.trim();
  }
}

export class CheckoutRevision extends Command {
  async run(path, repository, ref, revision) {
    await runGit(this.config.git, path, ['fetch', repository, ref]);
    await runGit(this.config.git, path, ['reset', '--hard']);
    await runGit(this.config.git, path, ['checkout', revision]);
  }
}
