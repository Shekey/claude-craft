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

const signals = (cwd, ...files) => spawnSync("node", [join(hooks, "repo.mjs"), "signals", ...files], { cwd, encoding: "utf8" }).stdout;
const expo = { "package.json": { dependencies: { expo: "54", "expo-router": "6" } } };
const fatScreen = ["Fit", "GoodFit", "ItemCard", "AltRow", "Falls"].map((n, i) => component(n, 30).replace(i ? "export " : "export function", i ? "" : "export default function")).join("\n");
const thinRoute = (screen) => `import { ${screen} } from "../features/${screen.toLowerCase()}";\n\nexport default function Route() {\n  return <${screen} />;\n}\n`;

test("a route file that holds the whole screen is flagged, thin routes and layouts are not", () => {
  const files = {
    ...expo,
    "app/fit.tsx": fatScreen,
    "app/plan.tsx": thinRoute("PlanScreen"),
    "app/_layout.tsx": ["Root", "Tabs"].map((n) => component(n, 50)).join("\n"),
    "app/+not-found.tsx": component("NotFound", 90),
  };
  const out = layout(makeRepo(files));
  assert.match(out, /^\d+\t5\tapp\/fit\.tsx\tflag · 5 components, \d+ lines$/m);
  assert.doesNotMatch(out, /app\/plan\.tsx\tflag|_layout\.tsx\tflag ·|not-found\.tsx\tflag ·/);
  assert.match(out, /^fat route files: 1 of 2 route files$/m);
});

test("a route file exporting helpers is flagged; framework exports are allowed", () => {
  const files = {
    ...expo,
    "app/a.tsx": `export function formatPlace(p: string) {\n  return p;\n}\nexport default function A() {\n  return null;\n}\n`,
    "app/b.tsx": `export const unstable_settings = { initialRouteName: "index" };\nexport function ErrorBoundary() {\n  return null;\n}\nexport default function B() {\n  return null;\n}\n`,
  };
  const out = layout(makeRepo(files));
  assert.match(out, /app\/a\.tsx\tflag · exports formatPlace$/m);
  assert.doesNotMatch(out, /app\/b\.tsx\tflag/);
});

test("fat route files across the repo are flagged as a pattern", () => {
  const files = { ...expo, "app/index.tsx": thinRoute("TodayScreen") };
  for (const name of ["fit", "closet", "plan"]) files[`app/${name}.tsx`] = fatScreen;
  assert.match(layout(makeRepo(files)), /^fat route files: 3 of 4 route files\tflag$/m);
});

test("route files only count when the app uses a file router", () => {
  assert.doesNotMatch(layout(makeRepo({ "package.json": {}, "app/fit.tsx": fatScreen })), /route files/);
});

test("signals checks the changed files and names each reason", () => {
  const repo = makeRepo({ ...expo, "app/plan.tsx": thinRoute("PlanScreen"), "app/fit.tsx": fatScreen });
  assert.match(signals(repo), /^app\/fit\.tsx\tflag · many components: 5 in \d+ lines · fat route file: 5 components, \d+ lines$/m);
  assert.doesNotMatch(signals(repo), /plan\.tsx/);
  assert.match(signals(repo, "app/plan.tsx"), /^no flags in 1 file\(s\)$/m);
});
