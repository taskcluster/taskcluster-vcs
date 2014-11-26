var exec = require('mz/child_process').exec;
module.exports = function (args) {
  var argv = [__dirname + '/../../bin/tc-vcs'].concat(args);
  return exec(argv.join(' '));
};
