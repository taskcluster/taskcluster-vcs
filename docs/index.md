# Taskcluster VCS Tools

Using VCS optimally in a CI environment is difficult `tc-vcs` aims to do
this job for you via a set of [taskcluster](http://docs.taskcluster.net/)
integrated commands.

Currently the following features are available:

 - Equal first class support for both hg and git.
 - Creating remote caches of clones [caches](./caching.md).
 - Utilization of remote and local caches for clone operations.
 - "Checkout revision" commands (useful for mozilla "try" like
   workflows)

## Usage:

This package has a somewhat stable internal interface (see /vcs) but it
is primarily designed to be used as a CLI.

```sh
npm install taskcluster-vcs -g
tc-vcs --help
```

## Developing:

This project is developed in node.js and uses [6to5](https://github.com/6to5/6to5)
to provide a complete ES6 based environment. In addition the
experimental `async` operator is used heavily in conjunction with
promises.

### Directory Structure:

  - bin/tc-vcs : Primary entrypoint.
  - cli/       : Individual CLI sub commands.
  - test/      : Tests for tc-vcs
  - vcs/       : Internal version control abstractions for hg/git

## Tests

Tests are written in mocha and require taskcluster credentials see the
[taskcluster client](https://github.com/taskcluster/taskcluster-client)
for details on how to configure the environment variables needed.

```sh
# Run all the tests
npm install

# Run one test
./node_modules/.bin/mocha <test>
```

## LICENSE

See [./LICENSE](LICENSE)
