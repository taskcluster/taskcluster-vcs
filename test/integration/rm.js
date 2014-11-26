var exec = require('mz/child_process').exec;
module.exports = function* (path) {
  return exec('rm -rf ' + __dirname + '/' + path);
};

