import { exec } from 'mz/child_process';

export default async function (path) {
  return await exec('rm -rf ' + __dirname + '/' + path);
};

