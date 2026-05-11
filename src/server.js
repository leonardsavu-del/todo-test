import http from 'node:http';
import { createStore } from './store.js';
import { createApi } from './api.js';
import { createWeb } from './web.js';
import { route } from './router.js';

export function createApp() {
  const store = createStore();
  const api = createApi(store);
  const web = createWeb(store);

  return async function app(req, res) {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const resolved = route(req.method, url.pathname, { api, web });

    let result;
    if (typeof resolved === 'function') {
      let body = null;
      if (hasBody(req.method)) {
        body = await readBody(req);
        if (body && body.__error) {
          return send(res, {
            status: 400,
            body: { error: 'invalid body' },
            headers: { 'content-type': 'application/json' },
          });
        }
      }
      result = resolved(body);
    } else {
      result = resolved;
    }

    send(res, result);
  };
}

function hasBody(method) {
  return method === 'POST' || method === 'PUT' || method === 'PATCH';
}

function readBody(req) {
  return new Promise((resolve) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      if (raw.length === 0) return resolve(null);
      const type = (req.headers['content-type'] || '').split(';')[0].trim();
      if (type === 'application/json') {
        try {
          return resolve(JSON.parse(raw));
        } catch {
          return resolve({ __error: true });
        }
      }
      if (type === 'application/x-www-form-urlencoded') {
        return resolve(Object.fromEntries(new URLSearchParams(raw)));
      }
      resolve(null);
    });
    req.on('error', () => resolve({ __error: true }));
  });
}

function send(res, { status, body, headers = {} }) {
  if (body === null || body === undefined || body === '') {
    res.writeHead(status, headers);
    res.end();
    return;
  }
  const payload =
    typeof body === 'string' ? body : JSON.stringify(body);
  const out = { ...headers };
  if (!out['content-type']) out['content-type'] = 'application/json';
  out['content-length'] = Buffer.byteLength(payload);
  res.writeHead(status, out);
  res.end(payload);
}

const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  const port = Number(process.env.PORT || 3000);
  const server = http.createServer(createApp());
  server.listen(port, () => {
    console.log(`todo-app listening on :${port}`);
  });
}
