var run = require('./run');
var exec = require('mz/child_process').exec;
var createCommand = require('./command');

module.exports.Clone = createCommand(function(source, dest) {
  return run(this.config.hg, ['clone', source, dest]);
})

module.exports.Revision = createCommand(function(source) {
  return exec(
    [this.config.hg, 'parent', '--template', '{node}'].join(' '),
    { cwd: source, env: process.env }
  )
  .then(function(results) {
    return results[0].trim();
  });
})
