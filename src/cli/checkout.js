import { ArgumentParser, RawDescriptionHelpFormatter } from 'argparse';
import detectLocal from '../vcs/detect_local';
import detect from '../vcs/detect';
import run from '../run';
import _mkdirp from 'mkdirp';
import fs from 'mz/fs';
import fsPath from 'path';

import clone from './clone';
import checkoutRevision from './checkout-revision';

export default async function main(config, argv) {
  let parser = new ArgumentParser({
    prog: 'tc-vcs checkout',
    version: require('../../package').version,
    formatterClass: RawDescriptionHelpFormatter,
    addHelp: true,
    description: `
      The checkout command is an idempontent way of ensuring the passed
      directory is "checked out" to a particular state using the correct vcs
      system based on the passed urls for the repositories.

      This means it is safe to run this command on an existing directory to
      update a clone or to specify an empty directory whcih a clone will be
      created then updated.

      Examples:\n

      (clone gaia into gaia directory with latest version of master)

      tc-vcs checkout gaia https://github.com/mozilla-b2g/gaia

      (clone a revision of try)

      tc-vcs checkout try https://hg.mozilla.org/mozilla-central https://hg.mozilla.org/try $REV $REV

    `
  });

  parser.addArgument(['--namespace'], {
    defaultValue: 'tc-vcs.v1.clones',
    help: `
      Namespace under Index to query should match the value set in
      create-clone-cache.
    `.trim()
  });

  parser.addArgument(['--force-clone'], {
    action: 'storeTrue',
    defaultValue: false,
    help: 'Clone from remote repository when cached copy is not available'.trim()
  });

  parser.addArgument(['directory'], {
    type: (value) => {
      return fsPath.resolve(value);
    },
    help: 'Target directory which to clone and update'
  });

  parser.addArgument(['baseUrl'], {
    help: 'Base repository to clone',
  });

  parser.addArgument(['headUrl'], {
    help: `
      Head url to fetch changes from. If this value is not given baseUrl is used.
    `,
    nargs: '?'
  });

  parser.addArgument(['headRev'], {
    help: `
      Revision/changeset to pull from the repository. If not given this defaults
      to the "tip"/"master" of the default branch.
    `,
    nargs: '?'
  });

  parser.addArgument(['headRef'], {
    help: `
      Reference on head to fetch this should usually be the same value as
      headRev primarily this may be needed for cases where you are fetching a
      revision from a git branch but must fetch the reference and then proceede
      to checkout the particular revision you want (git generally does not support
      pulling specific revisions only references).

      If not given defaults to headRev.
    `.trim(),
    nargs: '?'
  });

  let args = parser.parseArgs(argv);
  let cloneArgs = [args.baseUrl, args.directory];

  if (args.force_clone) {
    cloneArgs.unshift('--force-clone');
  }

  let remoteVcsConfig = await detect(args.baseUrl);

  // First check if the directory exists if it does it must be a detectable vcs
  // type...
  if (await fs.exists(args.directory)) {
    let vcsConfig;
    try {
      vcsConfig = await detectLocal(args.directory);
    } catch (err) {
      console.error(
        `
          "[taskcluster-vcs:error] ${args.directory}" exists but is not a known vcs type \n
          ${err.stack}
        `
      );
      process.exit(1);
    }

    if (vcsConfig.type != remoteVcsConfig.type) {
      console.warn(
        '[taskcluster-vcs:warning] Local cache is not same vcs type as remote purging...'
      );
      await run(`rm -Rf ${args.directory}`);
      await clone(config, cloneArgs);
    }
  } else {
    await clone(config, cloneArgs);
  }

  let vcsConfig = await detectLocal(args.directory);
  let vcs = require(`../vcs/${vcsConfig.type}`);

  // Purely for convenience we have a set of defaults which make this command
  // much easier to manage.
  if (!args.headUrl) args.headUrl = args.baseUrl;
  if (!args.headRev) {
    args.headRev = await vcs.branchName(config, args.directory);
  }
  if (!args.headRef) {
    args.headRef = args.headRev;
  }

  await checkoutRevision(
    config, [args.directory, args.headUrl, args.headRef, args.headRev]
  );
}

