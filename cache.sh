#! /bin/bash -vex

run_clone () {
  node task.js create-clone-cache --upload --proxy $1 | taskcluster run-task &
}

run_repo () {
  node task.js create-repo-cache --upload --proxy https://git.mozilla.org/b2g/B2G $1 | taskcluster run-task &
}

emulator_url () {
  echo "http://hg.mozilla.org/mozilla-central/raw-file/default/b2g/config/$1/sources.xml"
}

run_clone https://hg.mozilla.org/build/mozharness
run_clone https://hg.mozilla.org/build/tools
run_clone https://hg.mozilla.org/mozilla-central
run_clone https://hg.mozilla.org/integration/b2g-inbound
run_clone https://hg.mozilla.org/integration/mozilla-inbound
run_clone https://hg.mozilla.org/integration/gaia
run_clone https://hg.mozilla.org/integration/gaia-central

run_clone https://git.mozilla.org/b2g/B2G
run_clone https://github.com/mozilla-b2g/gaia
run_clone https://github.com/mozilla-b2g/B2G
run_clone https://github.com/mozilla-b2g/B2G-manifest

run_clone https://github.com/mozilla/gecko-dev

run_repo $(emulator_url emulator-ics)
run_repo $(emulator_url emulator)
run_repo $(emulator_url emulator-jb)
run_repo $(emulator_url emulator-kk)
run_repo $(emulator_url flame)
run_repo $(emulator_url flame-kk)
run_repo $(emulator_url nexus-4)

echo 'Running all tasks in parallel you may see log spam now...'
wait
