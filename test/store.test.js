import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createStore } from '../src/store.js';

describe('store.lists', () => {
  let store;
  beforeEach(() => {
    store = createStore();
  });

  test('list is empty initially', () => {
    assert.deepEqual(store.lists.list(), []);
  });

  test('create returns a list with id, trimmed name, createdAt', () => {
    const l = store.lists.create({ name: '  groceries  ' });
    assert.ok(l.id);
    assert.equal(l.name, 'groceries');
    assert.ok(l.createdAt);
  });

  test('create throws on missing/blank name', () => {
    assert.throws(() => store.lists.create({}), /name is required/);
    assert.throws(() => store.lists.create({ name: '   ' }), /name is required/);
    assert.throws(() => store.lists.create({ name: 42 }), /name is required/);
  });

  test('get returns list by id, null for unknown', () => {
    const l = store.lists.create({ name: 'a' });
    assert.equal(store.lists.get(l.id).id, l.id);
    assert.equal(store.lists.get('missing'), null);
  });

  test('update changes name and preserves id', () => {
    const l = store.lists.create({ name: 'a' });
    const next = store.lists.update(l.id, { name: 'b' });
    assert.equal(next.name, 'b');
    assert.equal(next.id, l.id);
  });

  test('update returns null for unknown id', () => {
    assert.equal(store.lists.update('missing', { name: 'x' }), null);
  });

  test('update throws on invalid name', () => {
    const l = store.lists.create({ name: 'a' });
    assert.throws(() => store.lists.update(l.id, { name: '  ' }), /non-empty/);
    assert.throws(() => store.lists.update(l.id, { name: 9 }), /non-empty/);
  });

  test('remove deletes the list and cascades todos', () => {
    const l = store.lists.create({ name: 'a' });
    store.todos.create({ listId: l.id, title: 't1' });
    store.todos.create({ listId: l.id, title: 't2' });
    assert.equal(store.todos.forList(l.id).length, 2);
    assert.equal(store.lists.remove(l.id), true);
    assert.equal(store.lists.get(l.id), null);
    assert.equal(store.todos.forList(l.id).length, 0);
  });

  test('remove returns false for unknown id', () => {
    assert.equal(store.lists.remove('missing'), false);
  });
});

describe('store.todos', () => {
  let store;
  let list;
  beforeEach(() => {
    store = createStore();
    list = store.lists.create({ name: 'l' });
  });

  test('forList returns only todos for that list', () => {
    const other = store.lists.create({ name: 'other' });
    store.todos.create({ listId: list.id, title: 'a' });
    store.todos.create({ listId: list.id, title: 'b' });
    store.todos.create({ listId: other.id, title: 'c' });
    assert.equal(store.todos.forList(list.id).length, 2);
    assert.equal(store.todos.forList(other.id).length, 1);
  });

  test('create requires a valid list', () => {
    assert.throws(
      () => store.todos.create({ listId: 'missing', title: 'x' }),
      /list not found/,
    );
  });

  test('create requires a non-empty title', () => {
    assert.throws(
      () => store.todos.create({ listId: list.id, title: '' }),
      /title is required/,
    );
    assert.throws(
      () => store.todos.create({ listId: list.id, title: 5 }),
      /title is required/,
    );
  });

  test('create trims title and defaults completed=false', () => {
    const t = store.todos.create({ listId: list.id, title: '  hi  ' });
    assert.equal(t.title, 'hi');
    assert.equal(t.completed, false);
    assert.equal(t.listId, list.id);
  });

  test('create honours completed flag', () => {
    const t = store.todos.create({ listId: list.id, title: 'x', completed: true });
    assert.equal(t.completed, true);
  });

  test('get returns todo or null', () => {
    const t = store.todos.create({ listId: list.id, title: 'a' });
    assert.equal(store.todos.get(t.id).id, t.id);
    assert.equal(store.todos.get('missing'), null);
  });

  test('update patches title and completed', () => {
    const t = store.todos.create({ listId: list.id, title: 'a' });
    const next = store.todos.update(t.id, { title: 'b', completed: true });
    assert.equal(next.title, 'b');
    assert.equal(next.completed, true);
  });

  test('update with partial patch keeps fields', () => {
    const t = store.todos.create({ listId: list.id, title: 'a', completed: true });
    const next = store.todos.update(t.id, { completed: false });
    assert.equal(next.title, 'a');
    assert.equal(next.completed, false);
  });

  test('update returns null for unknown id', () => {
    assert.equal(store.todos.update('missing', { title: 'x' }), null);
  });

  test('update throws on invalid title', () => {
    const t = store.todos.create({ listId: list.id, title: 'a' });
    assert.throws(() => store.todos.update(t.id, { title: '  ' }), /non-empty/);
    assert.throws(() => store.todos.update(t.id, { title: 42 }), /non-empty/);
  });

  test('remove deletes; returns false for unknown', () => {
    const t = store.todos.create({ listId: list.id, title: 'a' });
    assert.equal(store.todos.remove(t.id), true);
    assert.equal(store.todos.get(t.id), null);
    assert.equal(store.todos.remove('missing'), false);
  });
});

describe('store.clear', () => {
  test('clear wipes both lists and todos', () => {
    const store = createStore();
    const l = store.lists.create({ name: 'a' });
    store.todos.create({ listId: l.id, title: 't' });
    store.clear();
    assert.deepEqual(store.lists.list(), []);
    assert.deepEqual(store.todos.forList(l.id), []);
  });
});
