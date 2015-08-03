var date = new Date();
var deadline = new Date(date.valueOf() + 3600 * 1000);

var task = {
  provisionerId: 'aws-provisioner-v1',
  workerType: 'gaia',
  created: date,
  deadline: deadline,
  scopes: ['queue:*', 'index:*'],
  payload: {
    image: 'lightsofapollo/tc-vcs:2.3.4',
    command: process.argv.slice(2),
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
    description: 'cache',
    owner: 'jlal@mozilla.com',
    source: 'http://todo.com'
  }
};

console.log(JSON.stringify(task, null, 2));
