import {
  listsIndexPage,
  listDetailPage,
  todoEditPage,
  notFoundPage,
} from './views.js';

const html = (status, body) => ({
  status,
  body,
  headers: { 'content-type': 'text/html; charset=utf-8' },
});
const redirect = (path) => ({
  status: 303,
  body: '',
  headers: { location: path },
});

export function createWeb(store) {
  return {
    home() {
      return redirect('/lists');
    },

    listsIndex() {
      return html(200, listsIndexPage(store.lists.list()));
    },

    listsCreate(body) {
      try {
        const list = store.lists.create({ name: body?.name });
        return redirect(`/lists/${list.id}`);
      } catch {
        return redirect('/lists');
      }
    },

    listDetail(id) {
      const list = store.lists.get(id);
      if (!list) return html(404, notFoundPage('List not found'));
      const todos = store.todos.forList(id);
      return html(200, listDetailPage(list, todos));
    },

    listRemove(id) {
      store.lists.remove(id);
      return redirect('/lists');
    },

    todoCreate(listId, body) {
      if (!store.lists.get(listId)) return html(404, notFoundPage('List not found'));
      try {
        store.todos.create({ listId, title: body?.title });
      } catch {
        // ignore validation errors and just redirect back
      }
      return redirect(`/lists/${listId}`);
    },

    todoEdit(id) {
      const todo = store.todos.get(id);
      if (!todo) return html(404, notFoundPage('Todo not found'));
      const list = store.lists.get(todo.listId);
      if (!list) return html(404, notFoundPage('List not found'));
      return html(200, todoEditPage(todo, list));
    },

    todoUpdate(id, body) {
      const todo = store.todos.get(id);
      if (!todo) return html(404, notFoundPage('Todo not found'));
      try {
        store.todos.update(id, {
          title: body?.title,
          completed: body?.completed === 'on' || body?.completed === 'true',
        });
      } catch {
        // ignore validation errors and redirect back
      }
      return redirect(`/lists/${todo.listId}`);
    },

    todoToggle(id, body) {
      const todo = store.todos.get(id);
      if (!todo) return html(404, notFoundPage('Todo not found'));
      const completed = body?.completed === 'on' || body?.completed === 'true';
      store.todos.update(id, { completed });
      return redirect(`/lists/${todo.listId}`);
    },

    todoRemove(id) {
      const todo = store.todos.get(id);
      if (!todo) return redirect('/lists');
      const listId = todo.listId;
      store.todos.remove(id);
      return redirect(`/lists/${listId}`);
    },
  };
}
