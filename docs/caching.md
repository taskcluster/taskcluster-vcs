# Caching

Aside from the benefits of unified commands for hg/git heavy use of
caches is the other goal of tc-vcs. Often times in a CI type environment
various types of vcs operations are repeated (sometime many many times)
tc-vcs can make these operations very cheap and fast depending on how
you leverage the caches.


## Remote caching

TODO: Fill in after index refactoring...

## User directory caching

The `$HOME/.tc-vcs/` folder contains copies of the remote caches
(which are usually a tarball of some kind) this allows clone operations
to transparently optimize away the (normally) largest and slowest
operation you will run.

Aside from performance this allows you to use a "clean slate" (a fresh
clone usually) for each clone operation with minimal overhead.
