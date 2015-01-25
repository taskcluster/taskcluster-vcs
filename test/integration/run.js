import { spawn } from 'mz/child_process';
import eventToPromise from 'event-to-promise';

export default async function(args) {
  let binary = `${__dirname}/../../node_modules/.bin/6to5-node`;

  let argv = [
    '-r',
    __dirname + '/../../src/bin/tc-vcs.js', '-c', __dirname + '/config.yml'
  ].concat(args);

  let proc = spawn(binary, argv, {
    env: process.env,
    stdio: 'pipe'
  });

  let stdout = '';
  let stderr = '';

  proc.stderr.on('data', (buffer) => {
    if (process.env.DEBUG) process.stderr.write(buffer);
    stderr += buffer;
  });

  proc.stdout.on('data', (buffer) => {
    if (process.env.DEBUG) process.stdout.write(buffer);
    stdout += buffer;
  });

  let [exitCode] = await eventToPromise(proc, 'exit');
  if (exitCode !== 0) {
    throw new Error(`Error running command (${exitCode}) : ${stderr}`);
  }
  return [stdout, stderr];
}
