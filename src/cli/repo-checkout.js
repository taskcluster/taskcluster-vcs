import { ArgumentParser, RawDescriptionHelpFormatter } from 'argparse';
import detect from '../vcs/detect_remote';
import run from '../vcs/run';
import request from 'superagent-promise';
import fs from 'mz/fs';
import fsPath from 'path';

export default async function main(config, argv) {
  let parser = new ArgumentParser({
    prog: 'tc-vcs repo-checkout',
    version: require('../../package').version,
    addHelp: true,
    formatterClass: RawDescriptionHelpFormatter,
    description: `
      This is an potentially very brittle command which lives to forfill the
      needs of 'repo' (https://gerrit.googlesource.com/git-repo/) caching.
      The logic here is biased and may only function well with the b2g project.

      The primary reason to use this command is to utlize the underlying caches
      which the create-repo-cache command creates. The '.repo' directory will be
      expanded from the cache prior to running your command if avaialble.

      Examples:

        # Clone and cache b2g
        tc-vcs checkout https://github.com/mozilla/mozilla-b2g https://github.com/mozilla/mozilla-b2g master b2g
        tc-vcs repo-checkout -c './config.sh emulator-kk' b2g

    `.trim()
  });

  parser.addArgument(['--namespace'], {
    defaultValue: 'tc-vcs.v1.repo-init',
    help: `
      Namespace under Index to query should match the value set in
      create-clone-cache.
    `.trim()
  });

  parser.addArgument(['-c', '--command'], {
    help: `
      Command to use to initialize repo this is run with a bash shell.
    `
  });

  parser.addArgument(['directory'], {
    type: fsPath.resolve,
    help: 'Directory to run repo command in',
  });

  let args = parser.parseArgs(argv);

  // TODO: Caches....
  if (!await fs.exists(args.directory)) {
    console.error(`Directory (${args.directory}) provided must exist`);
    process.exit(1);
    return;
  }

  await run(args.command, { cwd: args.directory });

  if (!await fs.exists(fsPath.join(args.directory, '.repo'))) {
    console.error(`${args.command} ran but did not generate a .repo directory`);
    process.exit(1);
  }
}
