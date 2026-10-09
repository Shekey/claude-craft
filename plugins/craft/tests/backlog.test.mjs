import assert from "node:assert/strict";
import { test } from "node:test";
import { check, render, roadmap } from "../hooks/backlog.mjs";

const finding = (id, { sev = "high", kind = "design", rules = "D2", status = "todo", effort = "M", blast = "low", tests = "none", deps = "none", batch = "b1" } = {}) =>
  `## ${id} · ${sev} · ${kind}${rules ? ` · ${rules}` : ""} · ${status}
Files: app/a.tsx:1-5
Problem: p
Fix: f
Effort: ${effort} · Blast: ${blast} · Tests: ${tests} · Depends on: ${deps} · Batch: ${batch}
`;

const file = (...items) => `# Findings · x\nAssessed: today\n\n${items.join("\n")}`;
const problems = (text) => check(text).problems;

test("a well-formed backlog validates", () => {
  assert.deepEqual(problems(file(finding("A1"), finding("A2", { deps: "A1 (hard: uses the Draft type)" }))), []);
});

test("missing fields and bad values are reported", () => {
  const text = file("## A1 · urgent · design · D2 · todo\nFiles: a.ts:1\nProblem: p\nFix: f\nEffort: M · Batch: b\n");
  const found = problems(text).join("\n");
  assert.match(found, /severity must be/);
  assert.match(found, /Blast must be/);
  assert.match(found, /Tests must be/);
});

test("design findings need a rule, bugs do not", () => {
  assert.match(problems(file(finding("A1", { rules: "" }))).join("\n"), /need rule IDs/);
  assert.deepEqual(problems(file(finding("A1", { kind: "bug", rules: "" }))), []);
});

test("unknown, self and cyclic dependencies are reported", () => {
  const found = problems(
    file(finding("A1", { deps: "A9" }), finding("A2", { deps: "A2" }), finding("A3", { deps: "A4 (hard: x)" }), finding("A4", { deps: "A3 (hard: y)" })),
  ).join("\n");
  assert.match(found, /unknown A9/);
  assert.match(found, /depends on itself/);
  assert.match(found, /dependency cycle/);
});

test("soft dependencies never form a cycle", () => {
  const found = problems(file(finding("A1", { deps: "A2 (soft: nicer)" }), finding("A2", { deps: "A1 (soft: nicer)" })));
  assert.deepEqual(found, []);
});

test("explicit dependency without a reason is rejected", () => {
  assert.match(problems(file(finding("A1"), finding("A2", { deps: "A1 (hard)" }))).join("\n"), /needs a reason/);
});

test("minor findings need no blast, tests or batch", () => {
  const minor = "## A8 · minor · D5 · todo\nFiles: lib/a.ts:1\nProblem: p\nFix: f\nEffort: S\n";
  assert.deepEqual(problems(file(minor)), []);
});

test("roadmap puts dependencies first and starts with the unblocked high finding", () => {
  const text = file(
    finding("A1", { batch: "draft", sev: "high", effort: "M" }),
    finding("A2", { batch: "photo", sev: "high", effort: "S", deps: "A1 (hard: needs Draft)" }),
    finding("A3", { batch: "state", sev: "medium", effort: "L" }),
  );
  const result = roadmap(check(text).parsed);
  const names = result.sequence.map((s) => s.name);
  assert.ok(names.indexOf("draft") < names.indexOf("photo"));
  assert.equal(result.startFinding.id, "A1");
  assert.match(render(result), /Start here: A1/);
});

test("done findings do not block", () => {
  const text = file(finding("A1", { status: "done (abc123)" }), finding("A2", { batch: "photo", deps: "A1 (hard: x)" }));
  const result = roadmap(check(text).parsed);
  assert.equal(result.startFinding.id, "A2");
  assert.deepEqual(result.sequence[0].needs, []);
});

test("bugs outrank design findings of the same severity", () => {
  const text = file(finding("A1", { batch: "design" }), finding("A2", { kind: "bug", rules: "", batch: "bug" }));
  assert.equal(roadmap(check(text).parsed).sequence[0].name, "bug");
});

test("legacy dependency format counts as hard", () => {
  const text = file(finding("A1", { batch: "x" }), finding("A2", { batch: "y", deps: "A1" }));
  const result = roadmap(check(text).parsed);
  assert.deepEqual(result.sequence[1].needs, ["x"]);
});
