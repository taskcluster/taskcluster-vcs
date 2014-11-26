var exec = require('mz/child_process').exec;
module.exports = function() {
  return [
    exec('rm -rf ' + __dirname + '/../cache')
  ];
};
