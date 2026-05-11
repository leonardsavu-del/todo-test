export function escape(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const STYLE = `
  body { font-family: system-ui, -apple-system, sans-serif; max-width: 720px; margin: 2rem auto; padding: 0 1rem; color: #111; background: #fff; }
  main { display: block; }
  h1 { font-size: 1.5rem; margin: 0 0 1rem; }
  h2 { font-size: 1.1rem; margin: 1.5rem 0 .5rem; }
  a { color: #0046cc; text-decoration: underline; }
  a:hover { text-decoration: none; }
  form { display: inline; }
  ul { list-style: none; padding: 0; margin: 0; }
  li { padding: .55rem .25rem; border-bottom: 1px solid #ddd; display: flex; align-items: center; gap: .6rem; }
  .done { text-decoration: line-through; color: #555; }
  .row-actions { margin-left: auto; display: flex; gap: .4rem; align-items: center; }
  input[type=text] { padding: .45rem .6rem; font-size: 1rem; min-width: 18rem; border: 1px solid #777; border-radius: 4px; background: #fff; color: #111; }
  input[type=text]:focus { outline: 2px solid #0046cc; outline-offset: 1px; }
  input[type=checkbox] { transform: scale(1.15); }
  button { padding: .4rem .8rem; font-size: .9rem; cursor: pointer; background: #f3f3f3; border: 1px solid #555; border-radius: 4px; color: #111; }
  button:focus { outline: 2px solid #0046cc; outline-offset: 1px; }
  button.primary { background: #0046cc; color: #fff; border-color: #0046cc; }
  button.danger { background: #fff; color: #b00020; border-color: #b00020; }
  .crumb { color: #555; margin-bottom: 1rem; font-size: .9rem; }
  .empty { color: #555; font-style: italic; padding: .5rem 0; }
  .stack { display: flex; flex-direction: column; gap: .75rem; max-width: 26rem; }
  .stack label { display: flex; align-items: center; gap: .5rem; }
  .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
`;

function layout(title, body) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(title)}</title>
<style>${STYLE}</style>
</head>
<body>
<main>
${body}
</main>
</body>
</html>`;
}

export function listsIndexPage(lists) {
  const items =
    lists.length === 0
      ? '<p class="empty">No lists yet. Create one below.</p>'
      : `<ul aria-label="Todo lists">${lists
          .map(
            (l) => `
            <li>
              <a href="/lists/${escape(l.id)}">${escape(l.name)}</a>
              <span class="row-actions">
                <form action="/lists/${escape(l.id)}/delete" method="post">
                  <button class="danger" type="submit" aria-label="Delete list ${escape(l.name)}" onclick="return confirm('Delete this list and all its todos?')">Delete</button>
                </form>
              </span>
            </li>`,
          )
          .join('')}</ul>`;

  return layout(
    'Todo lists',
    `
    <h1>Todo lists</h1>
    ${items}
    <h2>New list</h2>
    <form action="/lists" method="post">
      <label for="new-list-name" class="sr-only">List name</label>
      <input id="new-list-name" type="text" name="name" placeholder="List name" required autofocus>
      <button class="primary" type="submit">Create list</button>
    </form>
  `,
  );
}

export function listDetailPage(list, todos) {
  const items =
    todos.length === 0
      ? '<p class="empty">No todos yet.</p>'
      : `<ul aria-label="Todos in ${escape(list.name)}">${todos
          .map(
            (t) => `
            <li>
              <form action="/todos/${escape(t.id)}/toggle" method="post">
                <input type="checkbox" name="completed" ${t.completed ? 'checked' : ''} aria-label="Mark '${escape(t.title)}' ${t.completed ? 'incomplete' : 'complete'}" onchange="this.form.submit()">
                <noscript><button type="submit">Toggle</button></noscript>
              </form>
              <span class="${t.completed ? 'done' : ''}">${escape(t.title)}</span>
              <span class="row-actions">
                <a href="/todos/${escape(t.id)}/edit" aria-label="Edit '${escape(t.title)}'">Edit</a>
                <form action="/todos/${escape(t.id)}/delete" method="post">
                  <button class="danger" type="submit" aria-label="Remove '${escape(t.title)}'">Remove</button>
                </form>
              </span>
            </li>`,
          )
          .join('')}</ul>`;

  return layout(
    `${list.name} — todos`,
    `
    <p class="crumb"><a href="/lists">&larr; All lists</a></p>
    <h1>${escape(list.name)}</h1>
    ${items}
    <h2>Add a todo</h2>
    <form action="/lists/${escape(list.id)}/todos" method="post">
      <label for="new-todo-title" class="sr-only">Todo title</label>
      <input id="new-todo-title" type="text" name="title" placeholder="What needs doing?" required autofocus>
      <button class="primary" type="submit">Add</button>
    </form>
  `,
  );
}

export function todoEditPage(todo, list) {
  return layout(
    `Edit todo`,
    `
    <p class="crumb"><a href="/lists">All lists</a> / <a href="/lists/${escape(list.id)}">${escape(list.name)}</a></p>
    <h1>Edit todo</h1>
    <form action="/todos/${escape(todo.id)}" method="post" class="stack">
      <label for="edit-todo-title">Title</label>
      <input id="edit-todo-title" type="text" name="title" value="${escape(todo.title)}" required>
      <label>
        <input type="checkbox" name="completed" ${todo.completed ? 'checked' : ''}>
        <span>Completed</span>
      </label>
      <div>
        <button class="primary" type="submit">Save</button>
        <a href="/lists/${escape(list.id)}">Cancel</a>
      </div>
    </form>
  `,
  );
}

export function notFoundPage(message = 'Not found') {
  return layout(
    'Not found',
    `<h1>${escape(message)}</h1><p><a href="/lists">Back to lists</a></p>`,
  );
}
