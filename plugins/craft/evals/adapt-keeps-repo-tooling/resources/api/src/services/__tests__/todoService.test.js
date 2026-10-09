import { createTodoService, NotFoundError } from "../todoService.js";
import { createTodoRepository } from "../../repositories/todoRepository.js";

const fixedClock = () => new Date("2026-01-02T03:04:05.000Z");

describe("todoService.complete", () => {
  it("marks the todo done with the completion time", () => {
    const db = { todos: [{ id: "1", title: "Write tests", done: false }] };
    const service = createTodoService(createTodoRepository(db), fixedClock);

    expect(service.complete("1")).toEqual({ id: "1", title: "Write tests", done: true, completedAt: "2026-01-02T03:04:05.000Z" });
  });

  it("throws NotFoundError for an unknown id", () => {
    const service = createTodoService(createTodoRepository({ todos: [] }), fixedClock);

    expect(() => service.complete("missing")).toThrow(NotFoundError);
  });
});
