var spawn = require('child_process').spawn;
var util = require('util');
var Promise = require('promise');
var assign = require('object-assign');

/**
Wrapper around process spawning with extra logging.
*/
function run(bin, args, opts) {
  var proc = spawn(bin, args, assign({ stdio: 'inherit' }, opts));
  var start = Date.now();
  var cmd = [bin].concat(args).join(' ');
  console.log('[tc-vcs] run start : %s', cmd);
  return new Promise(function(accept, reject) {
    proc.on('error', reject);
    proc.once('exit', function(code) {
      console.log(
        '[tc-vcs] run end : %s (%d) in %s ms', cmd, code, Date.now() - start
      );
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
