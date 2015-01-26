import run from './run';
import Command from './command';

export class Clone extends Command {
  async run(source, dest) {
    return await run(`${this.config.hg} clone ${source} ${dest}`);
  }
}

export class Revision extends Command {
  async run(cwd) {
    let [stdout] = await run(`${this.config.hg} parent --template {node}`, {
      buffer: true,
      cwd,
      verbose: false
    });

    return stdout.trim();
  }
}

export class CheckoutRevision extends Command {
  async run(cwd, repository, ref, revision) {
    await run(`${this.config.hg} pull -r ${revision} ${repository}`, { cwd });
    await run(`${this.config.hg} update -C ${revision}`, { cwd });
  }
}

export class GetRemoteUrl extends Command {
  async run(cwd) {
    let [stdout] = await run(`${this.config.hg} paths default`, { 
      cwd,
      verbose: false
    });
    return stdout.trim();
  }
}

export class GetBranchName extends Command {
  async run(cwd) {
    let [stdout] = await run(`${this.config.hg} branch`, {
      cwd,
      verbose: false
    });
    return stdout.trim();
  }
}
