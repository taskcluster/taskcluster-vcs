/**
Every operation in git/hg/etc... Use a common pattern where their context
contains options based on our config files and then .run is used to execute
specific operations.
*/
export default class {
  constructor(opts = {}) {
    this.config = Object.assign({}, opts);
  }

  run() {
    throw new Error('not implemented');
  }
}
