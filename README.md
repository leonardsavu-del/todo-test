# todo-app

Minimal Dockerised Node.js todo app with named lists, a server-rendered UI, and a JSON API. No external runtime dependencies — just the Node 20 standard library and the built-in `node:test` runner.

## UI pages

| Path                      | What it does                                          |
| ------------------------- | ----------------------------------------------------- |
| `/` → `/lists`            | Redirect                                              |
| `/lists`                  | View all lists, create a new one, delete a list       |
| `/lists/:id`              | View list contents, add a todo, toggle/remove a todo  |
| `/todos/:id/edit`         | Edit a todo (title + completed)                       |

Forms use plain HTML POSTs (no JS required, except a small `onchange` for the toggle checkbox).

## JSON API

| Method            | Path                          | Description                |
| ----------------- | ----------------------------- | -------------------------- |
| `GET`             | `/health`                     | Liveness check             |
| `GET`             | `/api/lists`                  | List all lists             |
| `POST`            | `/api/lists`                  | Create `{ name }`          |
| `GET`             | `/api/lists/:id`              | List + nested todos        |
| `PUT` / `PATCH`   | `/api/lists/:id`              | Rename                     |
| `DELETE`          | `/api/lists/:id`              | Remove (cascades todos)    |
| `GET`             | `/api/lists/:id/todos`        | Todos for a list           |
| `POST`            | `/api/lists/:id/todos`        | Add `{ title, completed? }`|
| `GET`             | `/api/todos/:id`              | Get one                    |
| `PUT` / `PATCH`   | `/api/todos/:id`              | Update (partial)           |
| `DELETE`          | `/api/todos/:id`              | Remove                     |

## Run

```bash
docker compose up --build      # → http://localhost:3000
```

Locally without Docker:

```bash
node src/server.js
```

## Test

```bash
npm test               # 102 unit/integration tests via node:test (~150ms)
npm run test:coverage  # same + coverage report (src/ only)
npm run test:e2e       # 5 Playwright tests (UI + WCAG accessibility scan)
```

Coverage comes from Node's built-in `--experimental-test-coverage` reporter and currently runs at ~99% lines / ~98% branches across `src/`.

The Playwright suite covers the create / view / edit / delete user flows and includes an axe-core accessibility scan that asserts **zero critical WCAG 2.1 A/AA violations** on the lists index, list detail, and edit pages.

First-time setup for the e2e tests:

```bash
npm install
npx playwright install chromium
```
