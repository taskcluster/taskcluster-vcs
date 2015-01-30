import { ArgumentParser } from 'argparse';
import detectLocal from '../vcs/detect_local';

export default async function main(config, argv) {
  let parser = new ArgumentParser({
    prog: 'tc-vcs revision',
    version: require('../../package').version,
    addHelp: true,
    description: 'get current revision'
  });


  let args = parser.parseKnownArgs(argv);
  let path = args[1][0] || process.cwd();
  let vcsConfig = await detectLocal(path);
  let module = require('../vcs/' + vcsConfig.type);
  let revision = new module.Revision(config);
  process.stdout.write(await revision.run(path));
}

