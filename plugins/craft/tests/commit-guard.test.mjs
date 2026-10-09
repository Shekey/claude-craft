import assert from "node:assert/strict";
import { test } from "node:test";
import { git, makeRepo, run } from "./helpers.mjs";

const guard = (cwd, command) => run("commit-guard.mjs", { cwd, input: { tool_input: { command } } });
const staged = (files) => {
  const repo = makeRepo(files);
  git(repo, "add", "-A");
  return repo;
};

test("blocks AI trailers and mentions in the message", () => {
  const repo = staged({ "a.ts": "export const a = 1;\n" });
  assert.equal(guard(repo, `git commit -m "Fix thing" -m "Co-Authored-By: Claude <noreply@anthropic.com>"`).code, 2);
  assert.equal(guard(repo, `git commit -m "Generated with Claude Code"`).code, 2);
});

test("allows a plain human message", () => {
  const repo = staged({ "a.ts": "export const a = 1;\n" });
  assert.equal(guard(repo, `git commit -m "Extract photo state into a union"`).code, 0);
});

test("blocks staged narration comments", () => {
  const repo = staged({ "a.ts": "// Added retry logic\nexport const a = 1;\n" });
  assert.equal(guard(repo, `git commit -m "Retry"`).code, 2);
});

test("allows why-comments and shortcut markers", () => {
  const repo = staged({ "a.ts": "// shortcut: in-memory cache, move to Redis past one instance\n// Order matters: the API rejects unsorted ids\nexport const a = 1;\n" });
  assert.equal(guard(repo, `git commit -m "Cache"`).code, 0);
});

test("docs may mention Claude", () => {
  const repo = staged({ "README.md": "Works with Claude Code.\n" });
  assert.equal(guard(repo, `git commit -m "Docs"`).code, 0);
});

test("non-git commands pass through", () => {
  const repo = staged({ "a.ts": "// Added x\n" });
  assert.equal(guard(repo, "ls -la").code, 0);
});

test("blocks pushing commits with AI trailers", () => {
  const repo = makeRepo({ "a.ts": "export {};\n" });
  git(repo, "add", "-A");
  git(repo, "commit", "-qm", "Add a\n\nCo-Authored-By: Claude <noreply@anthropic.com>");
  assert.equal(guard(repo, "git push origin main").code, 2);
});
