import { exec } from 'mz/child_process';

export default async function(args) {
  let binary = `${__dirname}/../../node_modules/.bin/6to5-node`;

  let argv = [
    binary,
    '-r',
    __dirname + '/../../src/bin/tc-vcs', '-c', __dirname + '/config.yml'
  ].concat(args);


  let cmd = argv.join(' ');

  let res;
  try {
    res = await exec(cmd, { env: process.env });
    return res;
  } catch (e) {
    console.error(cmd)
    throw e;
  }
}
