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

test("several components per file across the repo is flagged as a pattern", () => {
  const files = {};
  for (const screen of ["home", "profile", "orders", "cart"]) {
    files[`src/features/${screen}/ui.tsx`] = ["Header", "List", "Footer"].map((n) => `export const ${screen}${n} = () => null;\n`.replace(/^export const (\w)/, (_, c) => `export const ${c.toUpperCase()}`)).join("");
  }
  files["src/features/settings/ui.tsx"] = "export const Settings = () => null;\n";
  const out = layout(makeRepo(files));
  assert.match(out, /^several components per file \(3\+\): 4 of 5 component files\tflag/m);
});

test("one shared file is not a repo pattern", () => {
  const files = { "src/shared/ui/index.tsx": "export const Page = () => null;\nexport const Row = () => null;\nexport const Label = () => null;\n" };
  for (const screen of ["Home", "Profile", "Orders"]) files[`src/pages/${screen}.tsx`] = `export const ${screen} = () => null;\n`;
  assert.match(layout(makeRepo(files)), /^several components per file \(3\+\): 0 of 3 component files$/m);
});
