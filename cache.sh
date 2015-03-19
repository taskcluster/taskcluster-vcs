#! /bin/bash -e

run_clone () {
  node task.js create-clone-cache --upload --proxy $1 | taskcluster run-task &
}

run_repo () {
  node task.js create-repo-cache --upload --proxy https://git.mozilla.org/b2g/B2G $1 | taskcluster run-task &
}

emulator_url () {
  echo "http://hg.mozilla.org/mozilla-central/raw-file/default/b2g/config/$1/sources.xml"
}

g_emulator_url() {
  echo "https://raw.githubusercontent.com/mozilla-b2g/b2g-manifest/master/$1"
}

run_clone https://github.com/lightsofapollo/build-mozharness
run_clone https://hg.mozilla.org/build/mozharness
run_clone https://hg.mozilla.org/build/tools
run_clone https://hg.mozilla.org/mozilla-central
run_clone https://hg.mozilla.org/mozilla-central/
run_clone https://hg.mozilla.org/integration/b2g-inbound/
run_clone https://hg.mozilla.org/integration/b2g-inbound
run_clone https://hg.mozilla.org/integration/mozilla-inbound
run_clone https://hg.mozilla.org/integration/mozilla-inbound/
run_clone https://hg.mozilla.org/integration/gaia
run_clone https://hg.mozilla.org/integration/gaia-central
run_clone http://hg.mozilla.org/integration/fx-team/
run_clone http://hg.mozilla.org/integration/fx-team


run_clone https://hg.mozilla.org/integration/gaia-central
run_clone https://hg.mozilla.org/integration/gaia-central/

run_clone https://git.mozilla.org/b2g/B2G
run_clone https://github.com/mozilla-b2g/gaia
run_clone https://github.com/mozilla-b2g/B2G
run_clone https://github.com/mozilla-b2g/B2G-manifest
run_clone https://github.com/mozilla-b2g/moztt

run_clone https://github.com/mozilla/gecko-dev

run_repo $(emulator_url emulator-ics)
run_repo $(emulator_url emulator)
run_repo $(emulator_url emulator-jb)
run_repo $(emulator_url emulator-kk)
run_repo $(emulator_url flame)
run_repo $(emulator_url flame-kk)
run_repo $(emulator_url nexus-4)
run_repo $(emulator_url emulator-l)
run_repo $(emulator_url dolphin)
run_repo $(emulator_url dolphin-512)

run_repo $(g_emulator_url emulator.xml)
run_repo $(g_emulator_url emulator-jb.xml)
run_repo $(g_emulator_url emulator-kk.xml)
run_repo $(g_emulator_url emulator-l.xml)

echo 'Running all tasks in parallel you may see log spam now...'
wait
