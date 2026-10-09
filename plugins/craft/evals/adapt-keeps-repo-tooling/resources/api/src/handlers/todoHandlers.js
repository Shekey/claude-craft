import { NotFoundError } from "../services/todoService.js";

export function createTodoHandlers(service) {
  return {
    list: () => ({ status: 200, body: service.list() }),
    complete: ({ params }) => {
      try {
        return { status: 200, body: service.complete(params.id) };
      } catch (error) {
        if (error instanceof NotFoundError) return { status: 404, body: { error: error.message } };
        throw error;
      }
    },
  };
}
