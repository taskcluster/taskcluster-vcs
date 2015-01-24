var Promise = require('promise');
var fs = require('mz/fs');
var assert = require('assert');

module.exports = function detect(path) {
  assert(typeof path === 'string', 'path must be a string');
  assert(path, 'path is required')
  return Promise.all([
    fs.exists(path + '/.hg'),
    fs.exists(path + '/.git')
  ]).then(function(results) {
    if (results[0]) {
      return { type: 'hg' };
    }

    if (results[1]) {
      return { type: 'git' };
    }

    throw new Error(
      'unknown type of repository (' + path + ')' +
      '(this command must be run in root of repository)'
    );
  });
}
