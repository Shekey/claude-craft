export class NotFoundError extends Error {}

export function createTodoService(repository, clock = () => new Date()) {
  return {
    list: () => repository.list(),
    complete(id) {
      const todo = repository.findById(id);
      if (!todo) throw new NotFoundError(`Todo ${id} not found`);
      return repository.save({ ...todo, done: true, completedAt: clock().toISOString() });
    },
  };
}
