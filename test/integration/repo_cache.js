import slugid from 'slugid';
import createTask from './taskcluster';
import run from './run';

export default async function(url, command) {
  let namespace = 'public.test.jlal.' + slugid.v4();
  let taskId = await createTask();
  await run([
    'create-repo-cache',
    '--namespace', namespace,
    '--task-id', taskId,
    '--expires', '5 min',
    '--run-id', 0,
    '--command', command,
    url
  ]);
  return [namespace, taskId];
}

