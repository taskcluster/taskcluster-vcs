/**
Every operation in git/hg/etc... Use a common pattern where their context
contains options based on our config files and then .run is used to execute
specific operations.
*/

var assign = require('object-assign');
function Command(options) {
  this.config = assign({}, options);
}

Command.prototype.run = function() {
  throw new Error('not implemented');
};

module.exports = function create(fn) {
  function constructor() {
    Command.apply(this, arguments);
  }
  constructor.prototype = Object.create(Command.prototype);
  constructor.prototype.run = fn;
  return constructor;
};

module.exports.Command = Command;
