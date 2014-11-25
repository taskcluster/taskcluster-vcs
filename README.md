# TaskCluster VCS Tools (tc-vs)

## Strategy

The goal is to provide a moderately normalized clone/reset/checkout strategy for
both hg and git. Additionally where possible use caches (on s3) instead
of direct clones.

### Clone

```sh
tc-vcs clone <url>
```

We do a set of checks for clones that looks like this:

 - check for a cached version of this url

 - if no cached version determine what kind of resource this is
    - if <url> starts /w ssh convert to https for detection.
    - concurrently run
    - <url>?cmd=lookup&key=0 (if this is hg content-type will contain "mercurial")
    > https://github.com/git/git/blob/398dd4bd039680ba98497fbedffa415a43583c16/Documentation/technical/http-protocol.txt#L199 (for git)

  - else
    - copy from s3
