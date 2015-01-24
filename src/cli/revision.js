var ArgumentParser = require('argparse').ArgumentParser;
var detect = require('../vcs/detect_local');

module.exports = function main(config, argv) {
  var parser = new ArgumentParser({
    prog: 'tc-vcs revision',
    version: require('../../package').version,
    addHelp: true,
    description: 'get current revision'
  });


  var args = parser.parseKnownArgs(argv);
  var path = args[1][0] || process.cwd();

  detect(path)
    .then(function(vcsConfig) {
      var module = require('../vcs/' + vcsConfig.type);
      var revision = new module.Revision(config);
      return revision.run(path);
    })
    .then(function(rev) {
      process.stdout.write(rev);
    })
    .catch(function(e){
      process.nextTick(function() {
        throw e;
      });
    });
}

