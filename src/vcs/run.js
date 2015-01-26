import { spawn } from 'child_process';
import util from 'util';
import eventToPromise from 'event-to-promise';

/**
Wrapper around process spawning with extra logging.

@param {Array[String]} command for command,
@param {Object} opts usual options for spawn.
@param {Boolean} opts.buffer buffer output and return [stdout, stderr].
*/
export default async function run(command, opts = {}) {
  if (Array.isArray(command)) {
    command = command.join(' ');
  }

  opts = Object.assign({
    stdio: 'pipe',
    buffer: false,
    env: process.env,
    verbose: true
  }, opts)

  var start = Date.now();
  if (opts.verbose) console.log('[tc-vcs] run start : %s', command);
  var proc = spawn('/bin/bash', ['-ce'].concat(command), opts);
  let stdout = '';
  let stderr = '';

  proc.stdout.on('data', (buffer) => {
    if (opts.buffer) stdout += buffer;
    if (opts.verbose) process.stdout.write(buffer);
  });

  proc.stderr.on('data', (buffer) => {
    if (opts.buffer) stderr += buffer;
    if (opts.verbose) process.stderr.write(buffer);
  });

  let [exit] = await eventToPromise(proc, 'exit');

  if (opts.verbose) {
    console.log(
      '[tc-vcs] run end : %s (%s) in %s ms', command, exit, Date.now() - start
    );
  }

  if (exit != 0) {
    throw new Error(`Error running command: ${command}`);
  }

  return [stdout, stderr];
}
