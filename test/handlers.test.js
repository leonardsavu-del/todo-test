import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createStore } from '../src/store.js';
import { createApi } from '../src/api.js';
import { createWeb } from '../src/web.js';

describe('api handlers', () => {
  let store;
  let api;
  beforeEach(() => {
    store = createStore();
    api = createApi(store);
  });

  test('listsList returns 200 empty', () => {
    const r = api.listsList();
    assert.equal(r.status, 200);
    assert.deepEqual(r.body, []);
  });

  test('listsCreate 201, 400 on invalid body, 400 on bad name', () => {
    assert.equal(api.listsCreate(null).status, 400);
    assert.equal(api.listsCreate({}).status, 400);
    const r = api.listsCreate({ name: 'x' });
    assert.equal(r.status, 201);
    assert.equal(r.body.name, 'x');
  });

  test('listsGet returns 404 or list+todos', () => {
    assert.equal(api.listsGet('missing').status, 404);
    const list = store.lists.create({ name: 'a' });
    store.todos.create({ listId: list.id, title: 't' });
    const r = api.listsGet(list.id);
    assert.equal(r.status, 200);
    assert.equal(r.body.todos.length, 1);
  });

  test('listsUpdate returns 400/404/200', () => {
    assert.equal(api.listsUpdate('id', null).status, 400);
    assert.equal(api.listsUpdate('missing', { name: 'x' }).status, 404);
    const l = store.lists.create({ name: 'a' });
    assert.equal(api.listsUpdate(l.id, { name: '' }).status, 400);
    const r = api.listsUpdate(l.id, { name: 'b' });
    assert.equal(r.status, 200);
    assert.equal(r.body.name, 'b');
  });

  test('listsRemove returns 204/404', () => {
    assert.equal(api.listsRemove('missing').status, 404);
    const l = store.lists.create({ name: 'a' });
    assert.equal(api.listsRemove(l.id).status, 204);
  });

  test('todosForList returns 200/404', () => {
    assert.equal(api.todosForList('missing').status, 404);
    const l = store.lists.create({ name: 'a' });
    const r = api.todosForList(l.id);
    assert.equal(r.status, 200);
    assert.deepEqual(r.body, []);
  });

  test('todosCreate returns 201, 400, 404', () => {
    assert.equal(api.todosCreate('id', null).status, 400);
    assert.equal(api.todosCreate('missing', { title: 'x' }).status, 404);
    const l = store.lists.create({ name: 'a' });
    assert.equal(api.todosCreate(l.id, { title: '' }).status, 400);
    assert.equal(api.todosCreate(l.id, { title: 'x' }).status, 201);
  });

  test('todosGet returns 200/404', () => {
    assert.equal(api.todosGet('missing').status, 404);
    const l = store.lists.create({ name: 'a' });
    const t = store.todos.create({ listId: l.id, title: 'x' });
    assert.equal(api.todosGet(t.id).status, 200);
  });

  test('todosUpdate returns 200/400/404', () => {
    assert.equal(api.todosUpdate('id', null).status, 400);
    assert.equal(api.todosUpdate('missing', { title: 'x' }).status, 404);
    const l = store.lists.create({ name: 'a' });
    const t = store.todos.create({ listId: l.id, title: 'x' });
    assert.equal(api.todosUpdate(t.id, { title: '' }).status, 400);
    const r = api.todosUpdate(t.id, { completed: true });
    assert.equal(r.status, 200);
    assert.equal(r.body.completed, true);
  });

  test('todosRemove returns 204/404', () => {
    assert.equal(api.todosRemove('missing').status, 404);
    const l = store.lists.create({ name: 'a' });
    const t = store.todos.create({ listId: l.id, title: 'x' });
    assert.equal(api.todosRemove(t.id).status, 204);
  });
});

describe('web handlers', () => {
  let store;
  let web;
  beforeEach(() => {
    store = createStore();
    web = createWeb(store);
  });

  test('home redirects to /lists', () => {
    const r = web.home();
    assert.equal(r.status, 303);
    assert.equal(r.headers.location, '/lists');
  });

  test('listsIndex renders HTML', () => {
    store.lists.create({ name: 'groceries' });
    const r = web.listsIndex();
    assert.equal(r.status, 200);
    assert.match(r.headers['content-type'], /text\/html/);
    assert.match(r.body, /groceries/);
    assert.match(r.body, /New list/);
  });

  test('listsIndex shows empty state when no lists', () => {
    const r = web.listsIndex();
    assert.match(r.body, /No lists yet/);
  });

  test('listsCreate redirects to new list on success', () => {
    const r = web.listsCreate({ name: 'work' });
    assert.equal(r.status, 303);
    assert.match(r.headers.location, /^\/lists\/[a-f0-9-]+$/);
  });

  test('listsCreate redirects to /lists on invalid input', () => {
    const r = web.listsCreate({ name: '' });
    assert.equal(r.status, 303);
    assert.equal(r.headers.location, '/lists');
  });

  test('listDetail renders list page with todos', () => {
    const l = store.lists.create({ name: 'a' });
    store.todos.create({ listId: l.id, title: 'first' });
    const r = web.listDetail(l.id);
    assert.equal(r.status, 200);
    assert.match(r.body, /first/);
    assert.match(r.body, /Add a todo/);
  });

  test('listDetail returns 404 page for missing list', () => {
    const r = web.listDetail('missing');
    assert.equal(r.status, 404);
    assert.match(r.body, /List not found/);
  });

  test('listRemove redirects to /lists (works even if unknown)', () => {
    const l = store.lists.create({ name: 'a' });
    let r = web.listRemove(l.id);
    assert.equal(r.status, 303);
    assert.equal(r.headers.location, '/lists');
    r = web.listRemove('missing');
    assert.equal(r.headers.location, '/lists');
  });

  test('todoCreate redirects back to the list', () => {
    const l = store.lists.create({ name: 'a' });
    const r = web.todoCreate(l.id, { title: 'x' });
    assert.equal(r.headers.location, `/lists/${l.id}`);
  });

  test('todoCreate 404 if list missing', () => {
    const r = web.todoCreate('missing', { title: 'x' });
    assert.equal(r.status, 404);
  });

  test('todoCreate redirects back even if title invalid', () => {
    const l = store.lists.create({ name: 'a' });
    const r = web.todoCreate(l.id, { title: '' });
    assert.equal(r.headers.location, `/lists/${l.id}`);
  });

  test('todoEdit renders form for existing todo', () => {
    const l = store.lists.create({ name: 'a' });
    const t = store.todos.create({ listId: l.id, title: 'edit me' });
    const r = web.todoEdit(t.id);
    assert.equal(r.status, 200);
    assert.match(r.body, /edit me/);
    assert.match(r.body, /Save/);
  });

  test('todoEdit 404 if missing', () => {
    assert.equal(web.todoEdit('missing').status, 404);
  });

  test('todoEdit 404 if parent list missing', () => {
    const l = store.lists.create({ name: 'a' });
    const t = store.todos.create({ listId: l.id, title: 'x' });
    store.lists.remove(l.id);
    const r = web.todoEdit(t.id);
    assert.equal(r.status, 404);
  });

  test('todoUpdate applies title and completed=on', () => {
    const l = store.lists.create({ name: 'a' });
    const t = store.todos.create({ listId: l.id, title: 'a' });
    const r = web.todoUpdate(t.id, { title: 'new', completed: 'on' });
    assert.equal(r.headers.location, `/lists/${l.id}`);
    const after = store.todos.get(t.id);
    assert.equal(after.title, 'new');
    assert.equal(after.completed, true);
  });

  test('todoUpdate handles absent completed (unchecked) as false', () => {
    const l = store.lists.create({ name: 'a' });
    const t = store.todos.create({ listId: l.id, title: 'a', completed: true });
    web.todoUpdate(t.id, { title: 'a' });
    assert.equal(store.todos.get(t.id).completed, false);
  });

  test('todoUpdate ignores validation errors and redirects', () => {
    const l = store.lists.create({ name: 'a' });
    const t = store.todos.create({ listId: l.id, title: 'a' });
    const r = web.todoUpdate(t.id, { title: '' });
    assert.equal(r.headers.location, `/lists/${l.id}`);
  });

  test('todoUpdate 404 if todo missing', () => {
    assert.equal(web.todoUpdate('missing', { title: 'x' }).status, 404);
  });

  test('todoToggle flips completed', () => {
    const l = store.lists.create({ name: 'a' });
    const t = store.todos.create({ listId: l.id, title: 'a' });
    web.todoToggle(t.id, { completed: 'on' });
    assert.equal(store.todos.get(t.id).completed, true);
    web.todoToggle(t.id, {});
    assert.equal(store.todos.get(t.id).completed, false);
  });

  test('todoToggle 404 if missing', () => {
    assert.equal(web.todoToggle('missing', {}).status, 404);
  });

  test('todoRemove deletes and redirects to list', () => {
    const l = store.lists.create({ name: 'a' });
    const t = store.todos.create({ listId: l.id, title: 'a' });
    const r = web.todoRemove(t.id);
    assert.equal(r.headers.location, `/lists/${l.id}`);
    assert.equal(store.todos.get(t.id), null);
  });

  test('todoRemove redirects to /lists if todo missing', () => {
    const r = web.todoRemove('missing');
    assert.equal(r.headers.location, '/lists');
  });
});
