import slugid from 'slugid';

// To configure, define in your environment:
//   OWNER_EMAIL
//   TASKCLUSTER_ACCESS_TOKEN
//   TASKCLUSTER_CLIENT_ID
//
// Notes:
// * Only supports a workerType with permacreds at this time.

export function generateCacheGraph(tasks) {
  let graphId = slugid.nice();

  let graph = {
      metadata: {
        name:         'Clone Cache Graph',
        description:  'Creates cached copies of repositories to use with taskcluster-vcs',
        owner:        process.env.OWNER_EMAIL,
        source:       'https://github.com/taskcluster/taskcluster-vcs'
      },
      scopes: ['queue:*', 'index:*']
  }

  graph.tasks = tasks.map((task) => {
    return {
      taskId: slugid.nice(),
      task: task
    }
  })

  return {graphId, graph};
}

export function generateCloneTaskDefinition(repo) {

    var date = new Date();
    var deadline = new Date(date.valueOf() + 4 * (3600 * 1000));
    var params = ['create-clone-cache', '--force-clone', '--upload', '--proxy', repo]

    var task = {
      provisionerId: 'aws-provisioner-v1',
      workerType: 'gaia',
      created: date,
      deadline: deadline,
      scopes: ['queue:create-artifact:*', 'index:insert-task:tc-vcs.v1.clones.*'],
      payload: {
        image: 'taskcluster/taskcluster-vcs:2.3.15',
        command: params,
        maxRunTime: 3600,
        features: {
          taskclusterProxy: true
        },
        env: {
          DEBUG: '*'
        }
      },
      metadata: {
        name: `cache ${repo}`,
        description: params.join(' '),
        owner: process.env.OWNER_EMAIL,
        source: 'https://github.com/taskcluster/taskcluster-vcs'
      }
    };

    return task;

}

export function generateRepoCacheTaskDefinition(emulator, type) {
    var date = new Date();
    var deadline = new Date(date.valueOf() + 4 * (3600 * 1000));
    var repo = '';
    if (type === 'emulator_url') {
        repo = "http://hg.mozilla.org/mozilla-central/raw-file/default/b2g/config/" + emulator + "/sources.xml";
    } else if (type === 'g_emulator_url') {
        repo = "https://raw.githubusercontent.com/mozilla-b2g/b2g-manifest/master/" + emulator;
    } else {
        throw `Type ${type} is invalid.`
    }
    var params = ['create-repo-cache', '--force-clone', '--upload', '--proxy', 'https://git.mozilla.org/b2g/B2G', repo]

    var task = {
      provisionerId: 'aws-provisioner-v1',
      workerType: 'gaia',
      created: date,
      deadline: deadline,
      scopes: ['queue:*', 'index:*'],
      payload: {
        image: 'taskcluster/taskcluster-vcs:2.3.15',
        command: params,
        maxRunTime: 3600,
        features: {
          taskclusterProxy: true
        },
        env: {
          DEBUG: '*'
        }
      },
      metadata: {
        name: `cache ${emulator}`,
        description: params.join(' '),
        owner: process.env.OWNER_EMAIL,
        source: 'https://github.com/taskcluster/taskcluster-vcs'
      }
    };

    return task;
}
