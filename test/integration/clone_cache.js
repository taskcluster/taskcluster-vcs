import slugid from 'slugid';
import createTask from './taskcluster';
import run from './run';

export default async function(url) {
  let namespace = 'public.test.jlal.' + slugid.v4();
  let taskId = await createTask();
  await run([
    'create-clone-cache',
    '--namespace', namespace,
    '--task-id', taskId,
    '--expires', '5 min',
    '--run-id', 0,
    url
  ]);
  return [namespace, taskId];
}
