import locate from '../src/pathing';
import assert from 'assert';

suite('pathing', function() {

  test('joins (paths)', function() {
    let root = '/woot/_base_';
    [
      [
        [root, '', 'foobar.txt'],
        { absolute: `${root}/foobar.txt`, relative: 'foobar.txt' }
      ],
      [
        [root, 'path/', '../foobar.txt'],
        { absolute: `${root}/foobar.txt`, relative: 'foobar.txt' }
      ],
      [
        [root, 'path/', 'foobar.txt'],
        { absolute: `${root}/path/foobar.txt`, relative: 'path/foobar.txt' }
      ],
      [
        [root, 'path/a/b/c/', 'd/foobar.txt'],
        { absolute: `${root}/path/a/b/c/d/foobar.txt`, relative: 'path/a/b/c/d/foobar.txt' }
      ],
    ].map((pair) => {
      let [input, expected] = pair;
      let actual = locate(...input);
      assert.deepEqual(expected, actual);
    });
  });

  test('joins (urls)', function() {
    let root = 'https://example.com/_base_/';
    [
      [
        [root, '', 'foobar.txt'],
        { absolute: `${root}foobar.txt`, relative: 'foobar.txt' }
      ],
      [
        [root, `path/`, '../foobar.txt'],
        { absolute: `${root}foobar.txt`, relative: 'foobar.txt' }
      ],
      [
        [root, 'path/', 'foobar.txt'],
        { absolute: `${root}path/foobar.txt`, relative: 'path/foobar.txt' }
      ],
      [
        [root, 'path/a/b/c/', 'd/foobar.txt'],
        { absolute: `${root}path/a/b/c/d/foobar.txt`, relative: 'path/a/b/c/d/foobar.txt' }
      ],
    ].map((pair) => {
      let [input, expected] = pair;
      let actual = locate(...input);
      assert.deepEqual(expected, actual);
    });
  });

  test('urls which reach outside path', function() {
    assert.throws(function() {
      locate('https://e.com/woot/bar', '', '../../../baz');
    });

    assert.throws(function() {
      locate('/woot/bar', '', '../../../baz');
    }, /outside/);

    assert.throws(function() {
      locate('https://e.com/woot/bar', '..', 'baz');
    });

    assert.throws(function() {
      locate('/woot/bar', '..', 'baz');
    }, /outside/);
  });

});
