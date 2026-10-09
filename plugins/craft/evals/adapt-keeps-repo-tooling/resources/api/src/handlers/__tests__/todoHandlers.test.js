import { createTodoHandlers } from "../todoHandlers.js";
import { NotFoundError } from "../../services/todoService.js";

describe("todoHandlers.complete", () => {
  it("returns 404 when the todo does not exist", () => {
    const handlers = createTodoHandlers({
      complete: () => {
        throw new NotFoundError("Todo 9 not found");
      },
    });

    expect(handlers.complete({ params: { id: "9" } })).toEqual({ status: 404, body: { error: "Todo 9 not found" } });
  });
});
