import { spawn } from 'child_process';
import util from 'util';
import eventToPromise from 'event-to-promise';
import fs from 'fs';

const DEFAULT_RETRIES = 10;
const RETRY_SLEEP = 10000;
const RANDOMIZATION_FACTOR = 0.25;

/**
Wrapper around process spawning with extra logging.

@param {Array[String]} command for command,
@param {Object} opts usual options for spawn.
@param {Boolean} opts.buffer buffer output and return [stdout, stderr].
*/
export default async function run(command, config = {}, _try=0) {
  if (Array.isArray(command)) {
    command = command.join(' ');
  }

  let opts = Object.assign({
    stdio: 'pipe',
    buffer: false,
    verbose: true,
    raiseError: true,
    retries: 0
  }, config);

  let cwd = opts.cwd || process.cwd();
  var start = Date.now();
  if (opts.verbose) {
    console.log(`[tc-vcs] ${_try} run start : (cwd: ${cwd}) ${command}`);
  }
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
    eventToPromise(proc.stdout, 'end'),
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
    if (_try < opts.retries) {
      console.error(
        '[tc-vcs] run end (with error) try (%d/%d) retrying in %d ms : %s',
        _try,
        opts.retries,
        RETRY_SLEEP,
        command
      );

      // Sleep for a bit..
      let delay = Math.pow(2, _try) * RETRY_SLEEP;
      let rf = RANDOMIZATION_FACTOR; // Apply randomization factor
      delay = delay * (Math.random() * 2 * rf + 1 - rf);
      await new Promise(accept => setTimeout(accept, delay));
      let retryOpts = Object.assign({}, opts);

      // Issue the retry...
      return await run(command, retryOpts, _try + 1);
    }

    if (opts.raiseError) {
      let err = Error(`Error running command: ${command}`);
      err.retired = _try;
      throw err;
    }
  }

  return [stdout, stderr];
}
