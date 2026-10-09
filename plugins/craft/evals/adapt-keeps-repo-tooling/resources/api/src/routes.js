export function routes(handlers) {
  return {
    "GET /todos": handlers.list,
    "POST /todos/:id/complete": handlers.complete,
  };
}
