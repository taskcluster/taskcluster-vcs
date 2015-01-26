# Taskcluster VCS Tools

## Strategy

The goal is to provide a moderately normalized clone/reset/checkout strategy for
both hg and git. Additionally where possible use caches (on s3) instead
of direct clones.

## Usage:

This package has a somewhat stable internal interface (see /vcs) but it
is primarily designed to be used as a CLI.

```sh
npm install taskcluster-vcs -g
tc-vcs --help
```

## Developing:

### Directory Structure:

  - bin/tc-vcs : Primary entrypoint.
  - cli/       : Individual CLI sub commands.
  - test/      : Tests for tc-vcs
  - vcs/       : Internal version control abstractions for hg/git

## Tests

The tests require node 0.11x or greater and make heavy use of
generators/co this is only required for tests.

```sh
# Run all the tests
npm install

# Run one test
./test/test.sh <test>
```

## LICENSE

See [./LICENSE](LICENSE)
