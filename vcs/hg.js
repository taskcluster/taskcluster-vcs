var assign = require('object-assign');
var run = require('./run');
var exec = require('mz/child_process').exec;
var createCommand = require('./command');

function runHg(hg, cwd, commands, opts) {
  opts = assign({ cwd: cwd }, opts);
  opts.env = assign({}, process.env, opts.env);
  return run(hg, commands, opts);
}

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
});

module.exports.CheckoutRevision = createCommand(function(
  path,
  repository,
  ref,
  revision
) {
  return runHg(this.config.hg, path, [
    'pull',
    '-r',
    revision,
    repository
  ])
  .then(function() {
    return runHg(this.config.hg, path, [
      'update',
      '-C',
      revision
    ]);
  }.bind(this));
});
