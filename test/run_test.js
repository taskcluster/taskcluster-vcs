import run from '../src/run';
import assert from 'assert';
import fs from 'mz/fs';

suite('run', function() {

  test('successful with retries', async function() {
    let wrote = false;
    let createsEventually = async () => {
      await new Promise(accept => setTimeout(accept, 500));
      await fs.writeFile(`${this.home}`, 'woot');
      wrote = true;
    };

    await Promise.all([
      createsEventually(),
      run(`test -f ${this.home}`, {
        retries: 10
      })
    ]);
    assert.ok(wrote, 'actually had to write');
  });

  test('timeout during retry', async function() {
    try {
      await run('exit 1', {
        retries: 2
      });
    } catch (e) {
      assert(e.message.indexOf('exit 1') !== -1);
      assert.equal(e.retired, 2);
      return;
    }
    throw new Error('Expected exception..');
  });

});
