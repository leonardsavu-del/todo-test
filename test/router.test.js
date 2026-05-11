import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { route } from '../src/router.js';

const stubApi = {
  listsList: () => tag('api.listsList'),
  listsGet: (id) => tag('api.listsGet', id),
  listsCreate: (b) => tag('api.listsCreate', b),
  listsUpdate: (id, b) => tag('api.listsUpdate', id, b),
  listsRemove: (id) => tag('api.listsRemove', id),
  todosForList: (id) => tag('api.todosForList', id),
  todosCreate: (id, b) => tag('api.todosCreate', id, b),
  todosGet: (id) => tag('api.todosGet', id),
  todosUpdate: (id, b) => tag('api.todosUpdate', id, b),
  todosRemove: (id) => tag('api.todosRemove', id),
};
const stubWeb = {
  home: () => tag('web.home'),
  listsIndex: () => tag('web.listsIndex'),
  listsCreate: (b) => tag('web.listsCreate', b),
  listDetail: (id) => tag('web.listDetail', id),
  listRemove: (id) => tag('web.listRemove', id),
  todoCreate: (id, b) => tag('web.todoCreate', id, b),
  todoEdit: (id) => tag('web.todoEdit', id),
  todoUpdate: (id, b) => tag('web.todoUpdate', id, b),
  todoToggle: (id, b) => tag('web.todoToggle', id, b),
  todoRemove: (id) => tag('web.todoRemove', id),
};
const deps = { api: stubApi, web: stubWeb };
function tag(name, ...args) {
  return { name, args };
}

function call(method, path, body) {
  const r = route(method, path, deps);
  if (typeof r === 'function') return r(body);
  return r;
}

describe('router (HTML routes)', () => {
  test('GET /health → 200 immediate', () => {
    const r = route('GET', '/health', deps);
    assert.equal(r.status, 200);
    assert.deepEqual(r.body, { status: 'ok' });
  });

  test('GET / → web.home', () => {
    assert.equal(call('GET', '/').name, 'web.home');
  });

  test('GET /lists → web.listsIndex', () => {
    assert.equal(call('GET', '/lists').name, 'web.listsIndex');
  });

  test('POST /lists → web.listsCreate with body', () => {
    const r = call('POST', '/lists', { name: 'a' });
    assert.equal(r.name, 'web.listsCreate');
    assert.deepEqual(r.args[0], { name: 'a' });
  });

  test('GET /lists/:id → web.listDetail', () => {
    assert.equal(call('GET', '/lists/abc').args[0], 'abc');
  });

  test('POST /lists/:id/delete → web.listRemove', () => {
    assert.equal(call('POST', '/lists/abc/delete').name, 'web.listRemove');
  });

  test('POST /lists/:id/todos → web.todoCreate', () => {
    const r = call('POST', '/lists/abc/todos', { title: 't' });
    assert.equal(r.name, 'web.todoCreate');
    assert.equal(r.args[0], 'abc');
  });

  test('GET /todos/:id/edit → web.todoEdit', () => {
    assert.equal(call('GET', '/todos/xyz/edit').name, 'web.todoEdit');
  });

  test('POST /todos/:id/toggle → web.todoToggle', () => {
    assert.equal(call('POST', '/todos/xyz/toggle', { completed: 'on' }).name, 'web.todoToggle');
  });

  test('POST /todos/:id/delete → web.todoRemove', () => {
    assert.equal(call('POST', '/todos/xyz/delete').name, 'web.todoRemove');
  });

  test('POST /todos/:id → web.todoUpdate', () => {
    assert.equal(call('POST', '/todos/xyz', { title: 'x' }).name, 'web.todoUpdate');
  });

  test('unsupported method on /lists → 405', () => {
    assert.equal(route('DELETE', '/lists', deps).status, 405);
  });

  test('unsupported method on /lists/:id → 405', () => {
    assert.equal(route('POST', '/lists/abc', deps).status, 405);
  });

  test('unknown path → 404', () => {
    assert.equal(route('GET', '/nope', deps).status, 404);
  });
});

describe('router (JSON API routes)', () => {
  test('GET /api/lists', () => {
    assert.equal(call('GET', '/api/lists').name, 'api.listsList');
  });
  test('POST /api/lists', () => {
    assert.equal(call('POST', '/api/lists', { name: 'a' }).name, 'api.listsCreate');
  });
  test('GET /api/lists/:id', () => {
    assert.equal(call('GET', '/api/lists/abc').name, 'api.listsGet');
  });
  test('PUT /api/lists/:id', () => {
    assert.equal(call('PUT', '/api/lists/abc', {}).name, 'api.listsUpdate');
  });
  test('PATCH /api/lists/:id', () => {
    assert.equal(call('PATCH', '/api/lists/abc', {}).name, 'api.listsUpdate');
  });
  test('DELETE /api/lists/:id', () => {
    assert.equal(call('DELETE', '/api/lists/abc').name, 'api.listsRemove');
  });
  test('GET /api/lists/:id/todos', () => {
    assert.equal(call('GET', '/api/lists/abc/todos').name, 'api.todosForList');
  });
  test('POST /api/lists/:id/todos', () => {
    assert.equal(call('POST', '/api/lists/abc/todos', {}).name, 'api.todosCreate');
  });
  test('GET /api/todos/:id', () => {
    assert.equal(call('GET', '/api/todos/xyz').name, 'api.todosGet');
  });
  test('PUT /api/todos/:id', () => {
    assert.equal(call('PUT', '/api/todos/xyz', {}).name, 'api.todosUpdate');
  });
  test('PATCH /api/todos/:id', () => {
    assert.equal(call('PATCH', '/api/todos/xyz', {}).name, 'api.todosUpdate');
  });
  test('DELETE /api/todos/:id', () => {
    assert.equal(call('DELETE', '/api/todos/xyz').name, 'api.todosRemove');
  });
  test('unsupported method on /api/lists → 405', () => {
    assert.equal(route('DELETE', '/api/lists', deps).status, 405);
  });
  test('unsupported method on /api/lists/:id → 405', () => {
    assert.equal(route('POST', '/api/lists/abc', deps).status, 405);
  });
  test('unsupported method on /api/lists/:id/todos → 405', () => {
    assert.equal(route('DELETE', '/api/lists/abc/todos', deps).status, 405);
  });
  test('unsupported method on /api/todos/:id → 405', () => {
    assert.equal(route('POST', '/api/todos/xyz', deps).status, 405);
  });
  test('unknown /api path → 404', () => {
    assert.equal(route('GET', '/api/nope', deps).status, 404);
  });
});
