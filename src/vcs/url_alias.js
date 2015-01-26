import URL from 'url';
import urlJoin from 'url-join';

/**
Create an alias based on the url omitting protocol.
*/

export default function(url) {
  let components = URL.parse(url);
  return urlJoin(components.host, components.pathname);
}
