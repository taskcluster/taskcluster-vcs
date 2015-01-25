#! /usr/bin/env node

// Polyfill is required for async operations and other es6 features.
import '6to5/polyfill';

import { ArgumentParser } from 'argparse';
import fs from 'fs';
import fsPath from 'path';
import yaml from 'js-yaml';
import deap from 'deap';

function loadConfig(userConfig) {
  let defaults = yaml.safeLoad(fs.readFileSync(
    __dirname + '/../../default_config.yml', 'utf8'
  ));

  if (!userConfig) {
    return defaults;
  }
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
  require('../cli/' + name)(config, argv.slice(1)).catch((err) => {
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

  let args = parser.parseKnownArgs();
  let argv = args[1];
  let config = loadConfig(args[0].config);

  switch (argv[0]) {
    case 'checkout-revision':
      cli('checkout-revision', config, argv);
      break;
    case 'revision':
      cli('revision', config, argv);
      break;
    case 'clone':
      cli('clone', config, argv);
      break;
    case 'help':
    default:
      help();
      return;
  }
}

main(process.argv);

