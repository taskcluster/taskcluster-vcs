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
    `.trim()
  });

  parser.addArgument(['--namespace'], {
    defaultValue: 'tc-vcs.v1.clones',
    help: `
      Namespace under Index to query should match the value set in
      create-clone-cache.
    `.trim()
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

  let usedCache = await artifacts.useIfAvailable(
    alias,
    namespace,
    args.dest
  );

  // If we did not have the chance to utilize a cache clone the long way...
  if (!usedCache) {
    let vcsConfig = await detect(args.url);
    let vcs = require('../vcs/' + vcsConfig.type);
    await vcs.clone(config, args.url, args.dest);
  }
}
