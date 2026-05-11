export function createHandlers(store) {
  return {
    list() {
      return { status: 200, body: store.list() };
    },

    get(id) {
      const todo = store.get(id);
      if (!todo) return { status: 404, body: { error: 'not found' } };
      return { status: 200, body: todo };
    },

    create(body) {
      if (!body || typeof body !== 'object') {
        return { status: 400, body: { error: 'invalid body' } };
      }
      try {
        const todo = store.create(body);
        return { status: 201, body: todo };
      } catch (err) {
        return { status: 400, body: { error: err.message } };
      }
    },

    update(id, body) {
      if (!body || typeof body !== 'object') {
        return { status: 400, body: { error: 'invalid body' } };
      }
      try {
        const todo = store.update(id, body);
        if (!todo) return { status: 404, body: { error: 'not found' } };
        return { status: 200, body: todo };
      } catch (err) {
        return { status: 400, body: { error: err.message } };
      }
    },

    remove(id) {
      const ok = store.remove(id);
      if (!ok) return { status: 404, body: { error: 'not found' } };
      return { status: 204, body: null };
    },
  };
}
