import { Queue } from 'taskcluster-client';
import slugid from 'slugid';

let queue = new Queue();

export default async function createTask(npmCache={}) {
  let taskId = slugid.v4();
  let date = new Date();
  let deadline = new Date();
  deadline.setMinutes(deadline.getMinutes() + 5);

  let task = {
    provisionerId: 'null',
    workerType: 'null',
    created: date,
    deadline: deadline,
    payload: {},
    metadata: {
      name: 'test',
      description: 'xfoo',
      owner: 'jlal@mozilla.com',
      source: 'http://todo.com'
    },
    extra: {
      npmCache: npmCache
    }
  };

  await queue.createTask(taskId, task);
  await queue.claimTask(taskId, 0, { workerGroup: 'test', workerId: 'test' });
  return taskId;
}
