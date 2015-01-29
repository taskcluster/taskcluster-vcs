import { spawn } from 'child_process';
import util from 'util';
import eventToPromise from 'event-to-promise';
import fs from 'fs';

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

  let cwd = opts.cwd || process.cwd();
  var start = Date.now();
  if (opts.verbose) console.log(`[tc-vcs] run start : (cwd: ${cwd} ${command}`);
  var proc = spawn('/bin/bash', ['-c'].concat(command), opts);
  let stdout = '';
  let stderr = '';

  proc.stdout.on('data', (buffer) => {
    if (opts.verbose) process.stdout.write(buffer);
    if (opts.buffer) stdout += buffer;
  });

  proc.stderr.on('data', (buffer) => {
    if (opts.verbose) process.stdout.write(buffer);
    if (opts.buffer) stderr += buffer;
  });


  await Promise.all([
    eventToPromise(proc.stderr, 'end'),
    eventToPromise(proc.stderr, 'end'),
    eventToPromise(proc, 'exit')
  ])

  if (opts.verbose) {
    console.log(
      '[tc-vcs] run end : %s (%s) in %s ms',
      command, proc.exitCode, Date.now() - start
    );
  }

  if (proc.exitCode != 0) {
    throw new Error(`Error running command: ${command}`);
  }

  return [stdout, stderr];
}
