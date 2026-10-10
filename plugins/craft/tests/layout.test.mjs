import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { test } from "node:test";
import { hooks, makeRepo } from "./helpers.mjs";

const layout = (cwd, dir = ".") => spawnSync("node", [join(hooks, "repo.mjs"), "layout", dir], { cwd, encoding: "utf8" }).stdout;

const component = (name, lines) => `export function ${name}() {\n${"  const x = 1;\n".repeat(lines)}  return null;\n}\n`;

test("a crowded folder and a many-component file are flagged", () => {
  const files = { "package.json": "{}" };
  for (let i = 0; i < 22; i++) files[`lib/module${i}.ts`] = `export const value${i} = ${i};\n`;
  files["components/settings-cards.tsx"] = ["Profile", "Notifications", "Privacy", "Theme", "Language", "Storage"].map((n) => component(n, 40)).join("\n");
  const out = layout(makeRepo(files));
  assert.match(out, /^code files: 23 · size tier: small/m);
  assert.match(out, /^22\tlib\tflag$/m);
  assert.match(out, /^\d+\t6\tcomponents\/settings-cards\.tsx\tflag$/m);
});

test("a small UI kit and test files are not flagged", () => {
  const files = { "src/shared/ui/index.tsx": ["Page", "Row", "Label", "Field", "Button"].map((n) => `export const ${n} = () => null;\n`).join("") };
  for (let i = 0; i < 25; i++) files[`src/__tests__/case${i}.test.ts`] = "test('x', () => {});\n";
  const out = layout(makeRepo(files));
  assert.doesNotMatch(out, /flag$/m);
});

test("the size tier grows with the number of code files", () => {
  const files = {};
  for (let i = 0; i < 60; i++) files[`src/feature${i % 6}/file${i}.ts`] = "export {};\n";
  assert.match(layout(makeRepo(files)), /size tier: medium\+/);
});
