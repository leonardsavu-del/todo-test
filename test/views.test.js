import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  escape,
  listsIndexPage,
  listDetailPage,
  todoEditPage,
  notFoundPage,
} from '../src/views.js';

describe('views.escape', () => {
  test('handles null/undefined', () => {
    assert.equal(escape(null), '');
    assert.equal(escape(undefined), '');
  });
  test('escapes HTML-significant characters', () => {
    assert.equal(
      escape(`<a href="x" onclick='y'>& </a>`),
      '&lt;a href=&quot;x&quot; onclick=&#39;y&#39;&gt;&amp; &lt;/a&gt;',
    );
  });
});

describe('views pages', () => {
  test('listsIndexPage escapes list names', () => {
    const out = listsIndexPage([{ id: '1', name: '<script>x</script>' }]);
    assert.doesNotMatch(out, /<script>x<\/script>/);
    assert.match(out, /&lt;script&gt;x&lt;\/script&gt;/);
  });

  test('listDetailPage shows done class for completed todos', () => {
    const list = { id: 'L', name: 'L' };
    const out = listDetailPage(list, [
      { id: 't1', title: 'done one', completed: true },
      { id: 't2', title: 'not yet', completed: false },
    ]);
    assert.match(out, /class="done">done one/);
    assert.match(out, /class=""[^>]*>not yet/);
  });

  test('todoEditPage pre-fills title and completed', () => {
    const out = todoEditPage(
      { id: 't', title: 'hi', completed: true },
      { id: 'L', name: 'L' },
    );
    assert.match(out, /value="hi"/);
    assert.match(out, /checkbox" name="completed" checked/);
  });

  test('notFoundPage renders custom message', () => {
    const out = notFoundPage('Gone for good');
    assert.match(out, /Gone for good/);
  });
});
