import detectRemote from './detect_remote';
import detectLocal from './detect_local';
import fs from 'mz/fs';

export default async function detect(url) {
  if (fs.existsSync(url)) {
    return detectLocal(url);
  } else {
    return detectRemote(url);
  }
}
