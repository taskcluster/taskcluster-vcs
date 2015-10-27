#! /usr/bin/env node

// Polyfill is required for async operations and other es6 features.
import '6to5/polyfill';

import { ArgumentParser } from 'argparse';
import fs from 'fs';
import fsPath from 'path';
import yaml from 'js-yaml';
import deap from 'deap';

const GLOBAL_CONFIG = '/etc/taskcluster-vcs.yml';
const ACTION_DIR = fsPath.join(__dirname, '..', 'cli');
const ACTIONS = fs.readdirSync(ACTION_DIR).reduce((initial, cli) => {
  initial[cli.replace('.js', '')] = fsPath.join(ACTION_DIR, cli);
  return initial;
}, {});

function loadConfig(userConfig) {
  // Load defaults these always exist...
  let defaults = yaml.safeLoad(fs.readFileSync(
    __dirname + '/../../default_config.yml', 'utf8'
  ));

  // Machine global configs which override in tree defaults.
  if (fs.existsSync(GLOBAL_CONFIG)) {
    let globalConfig = yaml.safeLoad(fs.readFileSync(
      GLOBAL_CONFIG, 'utf8'
    ));
    defaults = deap(defaults, globalConfig);
  }

  if (!userConfig) {
    return defaults;
  }


  // User configs which override everything...
  return deap(defaults, userConfig);
}

function help() {
  let mustache = require('mustache');
  let content = fs.readFileSync(__dirname + '/../../src/bin/help.txt', 'utf8');

  console.log(mustache.render(content, {
    'version': require('../../package.json').version
  }));
}

function cli(name, config, argv) {
  require(name)(config, argv).catch((err) => {
    console.log(err.stack || err);
    if (err) {
      setTimeout(() => {
        throw err;
      });
    }
  });
}

function main(argv) {
  let parser = new ArgumentParser({
    addHelp: false,
    version: require('../../package.json').version
  });

  parser.addArgument(['-c', '--config'], {
    type: function(value) {
      return yaml.safeLoad(fs.readFileSync(fsPath.resolve(value), 'utf8'));
    }
  });

  parser.addArgument(['-h', '--help'], {
    action: 'storeTrue',
    help: 'Show help and usage...'
  });

  let rootArgs = [];
  let command = 'help';
  let commandArgs = [];

  let idx = -1;
  for (let arg of process.argv) {
    // keep track of the index position...
    idx++;
    // keep reading initial args until we see a sub command
    if (ACTIONS[arg]) {
      command = arg;
      commandArgs = process.argv.slice(idx + 1);
      break;
    }
    rootArgs.push(arg);
  }

  let args = parser.parseKnownArgs(rootArgs);
  let config = loadConfig(args[0].config);

  if (ACTIONS[command]) {
    return cli(ACTIONS[command], config, commandArgs);
  }

  help();
}

main(process.argv);

