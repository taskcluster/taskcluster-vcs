// To configure, define in your environment:
//   OWNER_EMAIL
//   TASKCLUSTER_ACCESS_TOKEN
//   TASKCLUSTER_CLIENT_ID
//
// Notes:
// * Only supports a workerType with permacreds at this time.

export function generateCloneTaskDefinition(repo) {

    var date = new Date();
    var deadline = new Date(date.valueOf() + 3600 * 1000);
    var params = ['create-clone-cache', '--upload', '--proxy', repo]

    var task = {
      provisionerId: 'aws-provisioner-v1',
      workerType: 'gaia',
      created: date,
      deadline: deadline,
      scopes: ['queue:*', 'index:*'],
      payload: {
        image: 'taskcluster/taskcluster-vcs:2.3.11',
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
        name: 'cache',
        description: params.join(' '),
        owner: process.env.OWNER_EMAIL,
        source: 'https://github.com/taskcluster/taskcluster-vcs'
      }
    };

    var task = JSON.stringify(task, null, 2);
    return task;

}

export function generateRepoCacheTaskDefinition(emulator, type) {
    var date = new Date();
    var deadline = new Date(date.valueOf() + 3600 * 1000);
    var repo = '';
    if (type === 'emulator_url') {
        repo = "http://hg.mozilla.org/mozilla-central/raw-file/default/b2g/config/" + emulator + "/sources.xml";
    } else if (type === 'g_emulator_url') {
        repo = "https://raw.githubusercontent.com/mozilla-b2g/b2g-manifest/master/" + emulator;
    } else {
        throw "Type ${type} is invalid."
    }
    var params = ['create-repo-cache', '--upload', '--proxy', 'https://git.mozilla.org/b2g/B2G', repo]

    var task = {
      provisionerId: 'aws-provisioner-v1',
      workerType: 'gaia',
      created: date,
      deadline: deadline,
      scopes: ['queue:*', 'index:*'],
      payload: {
        image: 'taskcluster/taskcluster-vcs:2.3.11',
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
        name: 'cache',
        description: params.join(' '),
        owner: process.env.OWNER_EMAIL,
        source: 'https://github.com/taskcluster/taskcluster-vcs'
      }
    };

    var task = JSON.stringify(task, null, 2);
    return task;
}
