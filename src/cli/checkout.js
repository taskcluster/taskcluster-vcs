import { ArgumentParser, RawDescriptionHelpFormatter } from 'argparse';
import detect from '../vcs/detect_local';
import run from '../vcs/run';
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

      (clone gaia)

      tc-vcs checkout https://github.com/mozilla-b2g/gaia https://github.com/mozilla-b2g/gaia master master gaia_dir

      (clone a revision of try)

      tc-vcs checkout https://hg.mozilla.org/mozilla-central https://hg.mozilla.org/try $REV $REV try_dir

    `
  });

  parser.addArgument(['--namespace'], {
    defaultValue: 'tc-vcs.v1.clones',
    help: `
      Namespace under Index to query should match the value set in
      create-clone-cache.
    `.trim()
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

  // First check if the directory exists if it does it must be a detectable vcs
  // type...
  if (await fs.exists(args.directory)) {
    try {
      let vcsConfig = await detect(args.directory);
    } catch (err) {
      console.error(
        `
          "${args.directory}" exists but is not a known vcs type \n
          ${err.stack}
        `
      );
      process.exit(1);
    }
  } else {
    await clone(config, [args.baseUrl, args.directory]);
  }

  let vcsConfig = await detect(args.directory);
  let module = require(`../vcs/${vcsConfig.type}`);

  // Purely for convenience we have a set of defaults which make this command
  // much easier to manage.
  if (!args.headUrl) args.headUrl = args.baseUrl;
  if (!args.headRev) {
    args.headRev = await (new module.GetBranchName(config)).run(args.directory);
  }
  if (!args.headRef) {
    args.headRef = args.headRev;
  }

  await checkoutRevision(
    config, [args.directory, args.headUrl, args.headRef, args.headRev]
  );
}

