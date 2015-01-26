import run from './run';
import Command from './command';

export class Clone extends Command {
  async run(source, dest) {
    return await run(`${this.config.git} clone ${source} ${dest}`);
  }
}

export class Revision extends Command {
  async run(cwd) {
    let [stdout] = await run(
      `${this.config.git} rev-parse HEAD`,
      {
        cwd,
        verbose: false,
        buffer: true
      }
    );
    return stdout.trim();
  }
}

export class CheckoutRevision extends Command {
  async run(cwd, repository, ref, revision) {
    await run(`${this.config.git} fetch ${repository} ${ref}`, { cwd });
    await run(`${this.config.git} reset --hard`, { cwd });
    await run(`${this.config.git} checkout ${revision}`, { cwd });
  }
}

export class GetRemoteUrl extends Command {
  async run(cwd) {
    let [stdout] = await run(
      `${this.config.git} config --get remote.origin.url`,
      { cwd, verbose: false, buffer: true }
    );
    return stdout.trim();
  }
}

export class GetBranchName extends Command {
  async run(cwd) {
    let [stdout] = await run(`${this.config.git} rev-parse --abbrev-ref HEAD`, {
      cwd,
      verbose: false,
      buffer: true
    });
    return stdout.trim();
  }
}
