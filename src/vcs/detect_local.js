import fs from 'mz/fs';
import assert from 'assert';

export default async function detect(path) {
  assert(typeof path === 'string', 'path must be a string');
  assert(path, 'path is required')

  let [isHg, isGit] = await Promise.all([
    fs.exists(path + '/.hg'),
    fs.exists(path + '/.git')
  ]);

  if (isHg) {
    return { type: 'hg' };
  }

  if (isGit) {
    return { type: 'git' };
  }

  throw new Error(
    'unknown type of repository (' + path + ')' +
    '(this command must be run in root of repository)'
  );
}
