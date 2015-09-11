import run from './run';
import { generateCloneTaskDefinition, generateRepoCacheTaskDefinition } from './task';

// import cache config

async function main(argv) {
    var clones = [
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
        'https://hg.mozilla.org/integration/gaia-central',
        'http://hg.mozilla.org/integration/fx-team/',
        'http://hg.mozilla.org/integration/fx-team',
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
        'https://hg.mozilla.org/projects/alder/'
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
        ['emulator_url', 'dolphin']
    ];

    var g_emulators = [
        ['g_emulator_url', 'emulator.xml'],
        ['g_emulator_url', 'emulator-jb.xml'],
        ['g_emulator_url', 'emulator-kk.xml'],
        ['g_emulator_url', 'emulator-l.xml']
    ];


    for (var i in clones) {
        var task = generateCloneTaskDefinition(clones[i]);
        await run(`echo '${task}' | taskcluster run-task --verbose`, {
            raiseError: true,
            verbose: true,
            buffer: false,
        });
    }
    for (var j in emulators) {
        var task = generateRepoCacheTaskDefinition(emulators[j][1], emulators[j][0]);
        console.log(task);
        await run(`echo '${task}' | taskcluster run-task --verbose`, {
            raiseError: true,
            verbose: true,
            buffer: false,
        });
    }
    for (var k in g_emulators) {
        var task = generateRepoCacheTaskDefinition(g_emulators[k][1], g_emulators[k][0]);
        console.log(task);
        await run(`echo '${task}' | taskcluster run-task --verbose`, {
            raiseError: true,
            verbose: true,
            buffer: false,
        });
   }
};

main(process.argv);
