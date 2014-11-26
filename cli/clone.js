var ArgumentParser = require('argparse').ArgumentParser;
var detect = require('../vcs/detect_remote');

module.exports = function main(config, argv) {
  var parser = new ArgumentParser({
    prog: 'tc-vcs clone',
    version: require('../package').version,
    addHelp: true,
    description: 'issue clone to correct vcs type'
  });

  parser.addArgument(['url'], {
    help: 'url which to clone from',
  });

  parser.addArgument(['dest'], {
    help: 'destination of clone'
  });

  var args = parser.parseArgs(argv);
  detect(args.url)
    .then(function(vcsConfig) {
      var url = vcsConfig.url;
      var module = require('../vcs/' + vcsConfig.type);
      var clone = new module.Clone(config);
      return clone.run(args.url, args.dest);
    })
    .catch(function(e) {
      process.nextTick(function() {
        throw e;
      });
    });
}
