import { Scheduler } from 'taskcluster-client';

import run from './run';
import { generateCacheGraph, generateCloneTaskDefinition, generateRepoCacheTaskDefinition } from './task';

// import cache config

async function main(argv) {
    var clones = [
        'https://github.com/walac/gecko-dev',
        'https://github.com/lightsofapollo/build-mozharness',
        'https://hg.mozilla.org/build/mozharness',
        'https://hg.mozilla.org/build/tools',
        'https://hg.mozilla.org/mozilla-central',
        'https://hg.mozilla.org/mozilla-central/',
        'https://hg.mozilla.org/integration/b2g-inbound/',
        'https://hg.mozilla.org/integration/b2g-inbound',
        'https://hg.mozilla.org/integration/mozilla-inbound',
        'https://hg.mozilla.org/integration/mozilla-inbound/',
        'https://hg.mozilla.org/integration/gaia',
        'https://hg.mozilla.org/integration/gaia/',
        'https://hg.mozilla.org/integration/gaia-2_5',
        'https://hg.mozilla.org/integration/gaia-2_5/',
        'https://hg.mozilla.org/integration/gaia-2_2r',
        'https://hg.mozilla.org/integration/gaia-2_2r/',
        'https://hg.mozilla.org/integration/fx-team/',
        'https://hg.mozilla.org/integration/fx-team',
        'https://git.mozilla.org/b2g/B2G.git',
        'https://hg.mozilla.org/integration/gaia-central',
        'https://hg.mozilla.org/integration/gaia-central/',
        'https://git.mozilla.org/b2g/B2G',
        'https://github.com/mozilla-b2g/gaia',
        'https://github.com/mozilla-b2g/B2G',
        'https://github.com/mozilla-b2g/B2G-manifest',
        'https://github.com/mozilla-b2g/moztt',
        'https://github.com/mozilla/gecko-dev',
        'https://git.mozilla.org/build/tooltool.git',
        'https://git.mozilla.org/external/google/gerrit/git-repo.git',
        'https://hg.mozilla.org/projects/alder',
        'https://hg.mozilla.org/projects/alder/',
        'https://hg.mozilla.org/releases/mozilla-b2g34_v2_1',
        'https://hg.mozilla.org/releases/mozilla-b2g34_v2_1/',
        'https://hg.mozilla.org/releases/mozilla-b2g37_v2_2r',
        'https://hg.mozilla.org/releases/mozilla-b2g37_v2_2r/',
        'https://hg.mozilla.org/releases/mozilla-b2g37_v2_2r/',
        'https://hg.mozilla.org/releases/mozilla-b2g44_v2_5',
        'https://hg.mozilla.org/releases/mozilla-b2g44_v2_5/'
    ];


    var emulators = [
        ['emulator_url', 'emulator-ics'],
        ['emulator_url', 'emulator'],
        ['emulator_url', 'emulator-jb'],
        ['emulator_url', 'emulator-kk'],
        ['emulator_url', 'aries'],
        ['emulator_url', 'flame'],
        ['emulator_url', 'flame-kk'],
        ['emulator_url', 'nexus-4'],
        ['emulator_url', 'emulator-l'],
        ['emulator_url', 'dolphin'],
        ['emulator_url', 'dolphin-512'],
        ['g_emulator_url', 'emulator.xml'],
        ['g_emulator_url', 'emulator-jb.xml'],
        ['g_emulator_url', 'emulator-kk.xml'],
        ['g_emulator_url', 'emulator-l.xml']
    ];

    var scheduler = new Scheduler();
    var tasks = [];

    for (var url of clones) {
        tasks.push(generateCloneTaskDefinition(url));
    }

    for (var emulator of emulators) {
        tasks.push(generateRepoCacheTaskDefinition(emulator[1], emulator[0]));
    }

    let {graphId, graph} = generateCacheGraph(tasks);
    console.log(`Creating cache graph '${graphId}'`);
    await scheduler.createTaskGraph(graphId, graph);
};

main(process.argv).catch((err) => {
  console.log(JSON.stringify(err));
  process.exit(1);
});

