const json = (status, body) => ({
  status,
  body,
  headers: { 'content-type': 'application/json' },
});
const notFound = () => json(404, { error: 'not found' });
const invalidBody = () => json(400, { error: 'invalid body' });
const isObj = (b) => b !== null && typeof b === 'object';

export function createApi(store) {
  return {
    listsList() {
      return json(200, store.lists.list());
    },

    listsGet(id) {
      const item = store.lists.get(id);
      if (!item) return notFound();
      return json(200, { ...item, todos: store.todos.forList(id) });
    },

    listsCreate(body) {
      if (!isObj(body)) return invalidBody();
      try {
        return json(201, store.lists.create(body));
      } catch (err) {
        return json(400, { error: err.message });
      }
    },

    listsUpdate(id, body) {
      if (!isObj(body)) return invalidBody();
      try {
        const updated = store.lists.update(id, body);
        if (!updated) return notFound();
        return json(200, updated);
      } catch (err) {
        return json(400, { error: err.message });
      }
    },

    listsRemove(id) {
      if (!store.lists.remove(id)) return notFound();
      return { status: 204, body: null, headers: {} };
    },

    todosForList(listId) {
      if (!store.lists.get(listId)) return notFound();
      return json(200, store.todos.forList(listId));
    },

    todosCreate(listId, body) {
      if (!isObj(body)) return invalidBody();
      try {
        return json(201, store.todos.create({ ...body, listId }));
      } catch (err) {
        if (err.message === 'list not found') return notFound();
        return json(400, { error: err.message });
      }
    },

    todosGet(id) {
      const item = store.todos.get(id);
      if (!item) return notFound();
      return json(200, item);
    },

    todosUpdate(id, body) {
      if (!isObj(body)) return invalidBody();
      try {
        const updated = store.todos.update(id, body);
        if (!updated) return notFound();
        return json(200, updated);
      } catch (err) {
        return json(400, { error: err.message });
      }
    },

    todosRemove(id) {
      if (!store.todos.remove(id)) return notFound();
      return { status: 204, body: null, headers: {} };
    },
  };
}
