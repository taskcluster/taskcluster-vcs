import { ArgumentParser } from 'argparse';
import detect from '../vcs/detect';
import createHash from '../hash';
import urlAlias from '../vcs/url_alias';
import Artifacts from '../artifacts';

export default async function main(config, argv) {
  let parser = new ArgumentParser({
    prog: 'tc-vcs clone',
    version: require('../../package').version,
    addHelp: true,
    description: `
      Clones the given repository automatically detecting the vcs type based on
      the remote url. This command will always favor the cache over directly
      hitting the remote url meaning the clone may be older then the current
      state of the repository (use checkout-revision to update it).

      By default if a cached copy is not available, cloning will fail. 
      Use '--force-clone' to fallback to cloning from the remote repository.
    `.trim()
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

  parser.addArgument(['url'], {
    help: 'url which to clone from',
  });

  parser.addArgument(['dest'], {
    help: 'destination of clone'
  });

  let args = parser.parseArgs(argv);
  let alias = urlAlias(args.url);
  let namespace = `${args.namespace}.${createHash(alias)}`;
  let artifacts = new Artifacts(config.cloneCache);

  // Download a cached copy if possible.
  let archivePath = await artifacts.downloadIfUnavailable(
    alias,
    namespace,
    args.dest
  );

  let vcsConfig = await detect(args.url);
  let vcs = require('../vcs/' + vcsConfig.type);

  // If we have a cached copy, extract and pull from latest upstream so we have latest
  // commits. Else, fall back to a full clone. The end state should be
  // reasonable consistent.
  if (archivePath) {
    await artifacts.extract(archivePath, args.dest);
    await vcs.pull(config, args.dest, args.url);
  } else {
    if (!args.force_clone) {
      console.error(
        '[taskcluster-vcs:error] Could not clone repository using cached copy. ' +
        'Use \'--force-clone\' to perform a full clone.'
      );
      process.exit(1);
    }

    await vcs.clone(config, args.url, args.dest);
  }
}
