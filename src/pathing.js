/**
This module handles potentially complex pathing rules applying logic to both
urls _and_ paths.
*/

import URL from 'url';
import fsPath from 'path';
import isPathInside from 'is-path-inside';

/**
Join two paths with a constraint that they share a root...
*/
export default function locate(root, base, relative) {
  // root may be a url so we should attempt to trick it into thinking it is a
  // path.
  let isUrl = false;
  let urlPrefix;
  let rootParts = URL.parse(root);
  let baseParts = URL.parse(base);

  if (rootParts.protocol) root = rootParts.pathname;
  if (baseParts.protocol) base = baseParts.pathname;

  let absoluteOut = fsPath.join(root, base, relative);
  let relativeOut = fsPath.join(base, relative);

  if (!isPathInside(absoluteOut, root)) {
    throw new Error(`From ${base} path ${relative} is outside ${root}`);
  }

  if (rootParts.protocol) {
    rootParts.pathname = rootParts.path = absoluteOut;
    absoluteOut = URL.format(rootParts);
  }

  return { absolute: absoluteOut, relative: relativeOut };
}
