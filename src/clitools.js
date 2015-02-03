/**
In addition to the vcs tooling shared by most commands there is a lot of shared
work between many of the commands to avoid lots of duplication many of these
utilities are shared here.
*/

import ms from 'ms';
import { Index, Queue } from 'taskcluster-client';

/**
Shorthand for getting at taskcluster queue client with proxy optionally enabled.

@param {Boolean} proxy
*/
export function getTcQueue(proxy=false) {
  let options = {};
  if (proxy) options.baseUrl = 'taskcluster/queue/v1';
  return new Queue(options);
}

/**
Shorthand for getting at taskcluster index client with proxy optionally enabled.

@param {Boolean} proxy
*/
export function getTcIndex(proxy=false) {
  let options = {};
  if (proxy) options.baseUrl = 'taskcluster/index/v1';
  return new Index(options);
}

/**
Defines the taskcluster upload arguments in a argument group.
*/
export function taskclusterGroup(parser) {
  return parser.addArgumentGroup({
    title: 'Taskcluster Artifacts',
    description: `
      To create remote caches taskcluster credentials (usually in the form of
      environment variables) are required. This must be enabled via the use
      of the --upload flag some of these arguments are required if --upload is
      used (such as --task-id and --run-id).
    `.trim()
  });
}

// Shared argument types in a dict to be a little more expilict...
export let arg = {
  upload(parser) {
    parser.addArgument(['--upload'], {
      action: 'storeTrue',
      defaultValue: false,
      help: `
        When this is set artifacts will be stored locally _and_ uploaded to 
        taskcluster (to the given task id) then indexed.
      `.trim()
    });
  },

  // All functions take a single argument a ArgumentParser
  taskId(parser) {
    parser.addArgument(['--task-id'], {
      dest: 'taskId',
      defaultValue: process.env.TASK_ID,
      help: 'Taskcluster Task ID'
    });
  },

  runId(parser) {
    parser.addArgument(['--run-id'], {
      dest: 'runId',
      defaultValue: process.env.RUN_ID,
      help: 'Taskcluster Run ID'
    });
  },

  expires(parser) {
    parser.addArgument(['--expires'], {
      defaultValue: '30 days',
      type: (v) => {
        return new Date(Date.now() + ms(v));
      },
      help: `
        Expiration for artifact and index value is parsed by the ms npm module 
        some other examples:


          1 minute
          3 days
          2 years

      `.trim()
    });
  },

  proxy(parser) {
    parser.addArgument(['--proxy'], {
      default: false,
      action: 'storeTrue',
      help: `
        Use docker-worker proxy when uploading artifacts and indexes. This should
        always be true when using the docker worker with this command.
     `.trim()
    });
  }
};
