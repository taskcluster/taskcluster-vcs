var assign = require('object-assign');
var run = require('./run');
var exec = require('mz/child_process').exec;
var createCommand = require('./command');

function runGit(git, cwd, commands, opts) {
  opts = assign({ cwd: cwd }, opts);
  opts.env = assign({}, process.env, opts.env);
  return run(git, commands, opts);
}

module.exports.Clone = createCommand(function(source, dest) {
  return run(this.config.git, ['clone', source, dest]);
});

module.exports.Revision = createCommand(function(source) {
  return exec(
    [this.config.git, 'rev-parse', 'HEAD'].join(' '),
    { cwd: source, env: process.env }
  )
  .then(function(results) {
    return results[0].trim();
  });
})

module.exports.CheckoutRevision = createCommand(function(
  path,
  repository,
  ref,
  revision
) {
  return runGit(this.config.git, path, [
    'fetch',
    repository,
    ref
  ])
  .then(function() {
    return runGit(this.config.git, path, [
      'reset',
      '--hard'
    ]);
  }.bind(this))
  .then(function() {
    return runGit(this.config.git, path, [
      'checkout',
      revision
    ]);
  }.bind(this))
});
