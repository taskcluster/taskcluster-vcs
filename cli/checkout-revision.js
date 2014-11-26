var ArgumentParser = require('argparse').ArgumentParser;
var detect = require('../vcs/detect_local');

module.exports = function main(config, argv) {
  var parser = new ArgumentParser({
    prog: 'tc-vcs checkout-revision',
    version: require('../package').version,
    addHelp: true,
    description: 'Checkout a revision (potentially from a remote)'
  });

  parser.addArgument(['path'], {
    help: 'Repository which to operate on'
  });

  parser.addArgument(['repository'], {
    help: 'Repository to pull from'
  });

  parser.addArgument(['ref'], {
    help: 'Reference (this can be a real ref / branch/ revision)'
  });

  parser.addArgument(['revision'], {
    help: 'revision'
  });

  var args = parser.parseArgs(argv);

  detect(args.path)
    .then(function(vcsConfig) {
      var module = require('../vcs/' + vcsConfig.type);
      var revision = new module.CheckoutRevision(config);
      return revision.run(args.path, args.repository, args.ref, args.revision);
    })
    .catch(function(e){
      process.nextTick(function() {
        throw e;
      });
    });
}
