export function route(method, pathname, { api, web }) {
  // Health
  if (pathname === '/health' && method === 'GET') {
    return immediate(200, { status: 'ok' });
  }

  // Root → /lists
  if (pathname === '/' && method === 'GET') {
    return () => web.home();
  }

  // JSON API
  if (pathname.startsWith('/api/')) {
    return routeApi(method, pathname.slice(4), api);
  }

  // HTML: lists collection
  if (pathname === '/lists') {
    if (method === 'GET') return () => web.listsIndex();
    if (method === 'POST') return (body) => web.listsCreate(body);
    return methodNotAllowed();
  }

  // HTML: list-scoped routes
  let m = pathname.match(/^\/lists\/([^/]+)$/);
  if (m) {
    if (method === 'GET') return () => web.listDetail(m[1]);
    return methodNotAllowed();
  }

  m = pathname.match(/^\/lists\/([^/]+)\/delete$/);
  if (m && method === 'POST') return () => web.listRemove(m[1]);

  m = pathname.match(/^\/lists\/([^/]+)\/todos$/);
  if (m && method === 'POST') return (body) => web.todoCreate(m[1], body);

  // HTML: todo-scoped routes
  m = pathname.match(/^\/todos\/([^/]+)\/edit$/);
  if (m && method === 'GET') return () => web.todoEdit(m[1]);

  m = pathname.match(/^\/todos\/([^/]+)\/toggle$/);
  if (m && method === 'POST') return (body) => web.todoToggle(m[1], body);

  m = pathname.match(/^\/todos\/([^/]+)\/delete$/);
  if (m && method === 'POST') return () => web.todoRemove(m[1]);

  m = pathname.match(/^\/todos\/([^/]+)$/);
  if (m && method === 'POST') return (body) => web.todoUpdate(m[1], body);

  return notFound();
}

function routeApi(method, pathname, api) {
  if (pathname === '/lists') {
    if (method === 'GET') return () => api.listsList();
    if (method === 'POST') return (body) => api.listsCreate(body);
    return methodNotAllowed();
  }

  let m = pathname.match(/^\/lists\/([^/]+)$/);
  if (m) {
    if (method === 'GET') return () => api.listsGet(m[1]);
    if (method === 'PUT' || method === 'PATCH') return (body) => api.listsUpdate(m[1], body);
    if (method === 'DELETE') return () => api.listsRemove(m[1]);
    return methodNotAllowed();
  }

  m = pathname.match(/^\/lists\/([^/]+)\/todos$/);
  if (m) {
    if (method === 'GET') return () => api.todosForList(m[1]);
    if (method === 'POST') return (body) => api.todosCreate(m[1], body);
    return methodNotAllowed();
  }

  m = pathname.match(/^\/todos\/([^/]+)$/);
  if (m) {
    if (method === 'GET') return () => api.todosGet(m[1]);
    if (method === 'PUT' || method === 'PATCH') return (body) => api.todosUpdate(m[1], body);
    if (method === 'DELETE') return () => api.todosRemove(m[1]);
    return methodNotAllowed();
  }

  return notFound();
}

function immediate(status, body) {
  return {
    status,
    body,
    headers: { 'content-type': 'application/json' },
  };
}

function notFound() {
  return {
    status: 404,
    body: { error: 'not found' },
    headers: { 'content-type': 'application/json' },
  };
}

function methodNotAllowed() {
  return {
    status: 405,
    body: { error: 'method not allowed' },
    headers: { 'content-type': 'application/json' },
  };
}
