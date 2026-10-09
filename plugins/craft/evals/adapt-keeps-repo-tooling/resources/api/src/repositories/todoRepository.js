export function createTodoRepository(db) {
  return {
    findById: (id) => db.todos.find((todo) => todo.id === id) ?? null,
    list: () => db.todos.filter((todo) => !todo.deletedAt),
    save: (todo) => {
      const index = db.todos.findIndex((existing) => existing.id === todo.id);
      if (index === -1) db.todos.push(todo);
      else db.todos[index] = todo;
      return todo;
    },
  };
}
