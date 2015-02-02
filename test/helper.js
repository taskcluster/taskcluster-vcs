import temp from 'promised-temp';
import run from '../src/vcs/run';

let home = temp.path();

setup(async function () {
  this.home = home;
  await run(`rm -Rf ${home}`, { verbose: false });
});

teardown(async function () {
  await run(`rm -Rf ${home}`, { verbose: false });
});

process.env['TC_VCS_HOME'] = home;
