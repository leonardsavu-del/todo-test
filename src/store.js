import { randomUUID } from 'node:crypto';

export function createStore() {
  const lists = new Map();
  const todos = new Map();

  return {
    lists: {
      list() {
        return Array.from(lists.values());
      },
      get(id) {
        return lists.get(id) ?? null;
      },
      create({ name }) {
        if (typeof name !== 'string' || name.trim() === '') {
          throw new Error('name is required');
        }
        const item = {
          id: randomUUID(),
          name: name.trim(),
          createdAt: new Date().toISOString(),
        };
        lists.set(item.id, item);
        return item;
      },
      update(id, patch) {
        const existing = lists.get(id);
        if (!existing) return null;
        const next = { ...existing };
        if (patch.name !== undefined) {
          if (typeof patch.name !== 'string' || patch.name.trim() === '') {
            throw new Error('name must be a non-empty string');
          }
          next.name = patch.name.trim();
        }
        lists.set(id, next);
        return next;
      },
      remove(id) {
        if (!lists.has(id)) return false;
        lists.delete(id);
        for (const [tid, todo] of todos) {
          if (todo.listId === id) todos.delete(tid);
        }
        return true;
      },
    },

    todos: {
      forList(listId) {
        return Array.from(todos.values()).filter((t) => t.listId === listId);
      },
      get(id) {
        return todos.get(id) ?? null;
      },
      create({ listId, title, completed = false }) {
        if (!lists.has(listId)) throw new Error('list not found');
        if (typeof title !== 'string' || title.trim() === '') {
          throw new Error('title is required');
        }
        const item = {
          id: randomUUID(),
          listId,
          title: title.trim(),
          completed: Boolean(completed),
          createdAt: new Date().toISOString(),
        };
        todos.set(item.id, item);
        return item;
      },
      update(id, patch) {
        const existing = todos.get(id);
        if (!existing) return null;
        const next = { ...existing };
        if (patch.title !== undefined) {
          if (typeof patch.title !== 'string' || patch.title.trim() === '') {
            throw new Error('title must be a non-empty string');
          }
          next.title = patch.title.trim();
        }
        if (patch.completed !== undefined) {
          next.completed = Boolean(patch.completed);
        }
        todos.set(id, next);
        return next;
      },
      remove(id) {
        return todos.delete(id);
      },
    },

    clear() {
      lists.clear();
      todos.clear();
    },
  };
}
