import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createApp } from '../src/server.js';

let server;
let base;

async function jsonReq(method, path, body) {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: body ? { 'content-type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  return {
    status: res.status,
    body: text ? JSON.parse(text) : null,
  };
}

async function formReq(method, path, fields) {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(fields).toString(),
    redirect: 'manual',
  });
  return {
    status: res.status,
    location: res.headers.get('location'),
    body: await res.text(),
  };
}

async function getHtml(path) {
  const res = await fetch(`${base}${path}`);
  return {
    status: res.status,
    contentType: res.headers.get('content-type'),
    body: await res.text(),
  };
}

describe('server (integration)', () => {
  before(async () => {
    server = http.createServer(createApp());
    await new Promise((resolve) => server.listen(0, resolve));
    const { port } = server.address();
    base = `http://127.0.0.1:${port}`;
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  test('GET /health', async () => {
    const res = await jsonReq('GET', '/health');
    assert.equal(res.status, 200);
    assert.deepEqual(res.body, { status: 'ok' });
  });

  test('JSON API: full lists+todos CRUD flow', async () => {
    let res = await jsonReq('POST', '/api/lists', { name: 'L1' });
    assert.equal(res.status, 201);
    const listId = res.body.id;

    res = await jsonReq('POST', `/api/lists/${listId}/todos`, { title: 'first' });
    assert.equal(res.status, 201);
    const todoId = res.body.id;

    res = await jsonReq('GET', `/api/lists/${listId}`);
    assert.equal(res.body.todos.length, 1);

    res = await jsonReq('PUT', `/api/todos/${todoId}`, { completed: true });
    assert.equal(res.body.completed, true);

    res = await jsonReq('DELETE', `/api/todos/${todoId}`);
    assert.equal(res.status, 204);

    res = await jsonReq('DELETE', `/api/lists/${listId}`);
    assert.equal(res.status, 204);
  });

  test('JSON API: invalid JSON returns 400', async () => {
    const res = await fetch(`${base}/api/lists`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{nope',
    });
    assert.equal(res.status, 400);
  });

  test('JSON API: missing name returns 400', async () => {
    const res = await jsonReq('POST', '/api/lists', {});
    assert.equal(res.status, 400);
  });

  test('JSON API: unknown route 404, bad method 405', async () => {
    assert.equal((await jsonReq('GET', '/api/nope')).status, 404);
    assert.equal((await jsonReq('DELETE', '/api/lists')).status, 405);
  });

  test('HTML: GET / redirects to /lists', async () => {
    const res = await fetch(`${base}/`, { redirect: 'manual' });
    assert.equal(res.status, 303);
    assert.equal(res.headers.get('location'), '/lists');
  });

  test('HTML: GET /lists renders empty state', async () => {
    const res = await getHtml('/lists');
    assert.equal(res.status, 200);
    assert.match(res.contentType, /text\/html/);
    assert.match(res.body, /Todo lists/);
    assert.match(res.body, /New list/);
  });

  test('HTML: create list via form, then view it', async () => {
    const create = await formReq('POST', '/lists', { name: 'shopping' });
    assert.equal(create.status, 303);
    const newUrl = create.location;
    assert.match(newUrl, /^\/lists\//);

    const view = await getHtml(newUrl);
    assert.equal(view.status, 200);
    assert.match(view.body, /shopping/);
    assert.match(view.body, /Add a todo/);
  });

  test('HTML: add todo, edit it, toggle, then remove', async () => {
    const created = await formReq('POST', '/lists', { name: 'work' });
    const listUrl = created.location;
    const listId = listUrl.split('/').pop();

    const addRes = await formReq('POST', `${listUrl}/todos`, { title: 'do thing' });
    assert.equal(addRes.location, listUrl);

    const after = await getHtml(listUrl);
    assert.match(after.body, /do thing/);
    const m = after.body.match(/\/todos\/([a-f0-9-]+)\/edit/);
    assert.ok(m, 'edit link should exist');
    const todoId = m[1];

    const editPage = await getHtml(`/todos/${todoId}/edit`);
    assert.equal(editPage.status, 200);
    assert.match(editPage.body, /do thing/);

    const upd = await formReq('POST', `/todos/${todoId}`, {
      title: 'renamed',
      completed: 'on',
    });
    assert.equal(upd.location, `/lists/${listId}`);

    const final = await getHtml(listUrl);
    assert.match(final.body, /renamed/);
    assert.match(final.body, /class="done"/);

    const rm = await formReq('POST', `/todos/${todoId}/delete`);
    assert.equal(rm.location, `/lists/${listId}`);

    const empty = await getHtml(listUrl);
    assert.doesNotMatch(empty.body, /renamed/);
  });

  test('HTML: delete list via form', async () => {
    const created = await formReq('POST', '/lists', { name: 'temp' });
    const id = created.location.split('/').pop();
    const del = await formReq('POST', `/lists/${id}/delete`);
    assert.equal(del.location, '/lists');
    assert.equal((await getHtml(`/lists/${id}`)).status, 404);
  });

  test('HTML: missing list returns 404 page', async () => {
    const res = await getHtml('/lists/does-not-exist');
    assert.equal(res.status, 404);
    assert.match(res.body, /List not found/);
  });

  test('HTML: missing todo edit returns 404 page', async () => {
    const res = await getHtml('/todos/does-not-exist/edit');
    assert.equal(res.status, 404);
  });
});
