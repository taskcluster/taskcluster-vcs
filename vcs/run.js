var spawn = require('child_process').spawn;
var util = require('util');
var Promise = require('promise');
var assign = require('object-assign');

/**
Wrapper around process spawning with extra logging.
*/
function run(bin, args, opts) {
  var proc = spawn(bin, args, assign({ stdio: 'inherit' }, opts));
  return new Promise(function(accept, reject) {
    proc.on('error', reject);
    proc.once('exit', function(code) {
      if (code === 0) accept();
      reject(new Error(util.format(
        'Running "%s %s" has failed %d',
        bin,
        args.join(' '),
        code
      )));
    });
  });
}

module.exports = run;
