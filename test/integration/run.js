var exec = require('mz/child_process').exec;
module.exports = function (args) {
  var argv = [
    __dirname + '/../../bin/tc-vcs', '-c', __dirname + '/config.yml'
  ].concat(args);

  return exec(argv.join(' '));
};
