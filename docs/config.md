# Configuration

Aside from the normal command line flags taskcluster-vcs provides a number of
special configuration options.

The defaults for these values exists in the [repository](https://github.com/taskcluster/taskcluster-vcs/blob/master/default_config.yml) and are documented there.

Typically the defaults are fine but if you want to override path
location or a utility (such as replacing curl with aria2c) you can
override this config file with one of your wn:

  1. Passing -c `taskcluster-vcs -c myconfig ...`
  2. A config file in `/etc/taskcluster-vcs.yml`

The config options _merge_ so you can use both -c and /etc/taskcluster-vcs.yml together
(-c overrides /etc/taskcluster-vcs.yml and /etc/tc-vs.yml overrides the
defaults)
