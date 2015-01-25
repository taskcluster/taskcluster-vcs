import run from './run';
import { exec } from 'mz/child_process';
import Command from './command';

function runHg(hg, cwd, commands, opts) {
  opts = Object.assign({ cwd: cwd }, opts);
  opts.env = Object.assign({}, process.env, opts.env);
  return run(hg, commands, opts);
}

export class Clone extends Command {
  async run(source, dest) {
    return await run(this.config.hg, ['clone', source, dest]);
  }
}

export class Revision extends Command {
  async run(source) {
    let [stdout] = await exec(
      [this.config.hg, 'parent', '--template', '{node}'].join(' '),
      { cwd: source, env: process.env }
    );
    return stdout.trim();
  }
}

export class CheckoutRevision extends Command {
  async run(path, repository, ref, revision) {
    await runHg(this.config.hg, path, ['pull', '-r', revision, repository]);
    await runHg(this.config.hg, path, ['update', '-C', revision]);
  }
}
