import assert from "node:assert/strict";
import { test } from "node:test";
import { commands, makeRepo, plan } from "./helpers.mjs";

const ts = { "src/a.ts": "export const a = 1;\n", "tsconfig.json": "{}" };

test("pnpm + biome + vitest", () => {
  const repo = makeRepo({
    ...ts,
    "pnpm-lock.yaml": "",
    "biome.json": "{}",
    "package.json": { devDependencies: { vitest: "1" } },
  });
  const steps = plan(repo);
  assert.match(commands(steps, "fix")[0], /^pnpm exec biome check --write/);
  assert.ok(commands(steps, "check").includes("pnpm exec tsc --noEmit -p tsconfig.json"));
  assert.ok(commands(steps, "check").some((c) => c.startsWith("pnpm exec vitest related --run --passWithNoTests")));
});

test("yarn classic uses yarn <bin>, not yarn exec", () => {
  const repo = makeRepo({ ...ts, "yarn.lock": "", ".eslintrc.json": "{}", "package.json": { devDependencies: { jest: "29" } } });
  const all = commands(plan(repo));
  assert.ok(all.some((c) => c.startsWith("yarn eslint --fix")));
  assert.ok(all.some((c) => c.startsWith("yarn jest --passWithNoTests --findRelatedTests")));
  assert.ok(!all.some((c) => c.includes("yarn exec")));
});

test("npm passes flags through npx", () => {
  const repo = makeRepo({ ...ts, "package-lock.json": "{}", "package.json": { devDependencies: { jest: "29" } } });
  assert.ok(commands(plan(repo)).some((c) => c.startsWith("npx --no -- jest --passWithNoTests --findRelatedTests")));
});

test("package scripts win over raw tools", () => {
  const repo = makeRepo({ ...ts, "pnpm-lock.yaml": "", "package.json": { scripts: { lint: "x", typecheck: "y" } } });
  const all = commands(plan(repo), "check");
  assert.ok(all.includes("pnpm run lint"));
  assert.ok(all.includes("pnpm run typecheck"));
});

test("react native app: kotlin file goes to gradle, ts file to node", () => {
  const repo = makeRepo({
    "package.json": { workspaces: ["apps/*"] },
    "pnpm-lock.yaml": "",
    "apps/mobile/package.json": { scripts: { lint: "x" } },
    "apps/mobile/app/a.tsx": "export {};\n",
    "apps/mobile/android/settings.gradle": "",
    "apps/mobile/android/gradlew": "",
    "apps/mobile/android/app/src/Main.kt": "class A\n",
  });
  const steps = plan(repo);
  assert.ok(steps.some((s) => s.dir === "apps/mobile/android" && s.command.startsWith("./gradlew check")));
  assert.ok(steps.some((s) => s.dir === "apps/mobile" && s.command === "pnpm run lint"));
});

test("python uses ruff", () => {
  const repo = makeRepo({ "pyproject.toml": "[tool.mypy]\n", "app/a.py": "x = 1\n" });
  const all = commands(plan(repo));
  assert.ok(all.includes("ruff check ."));
  assert.ok(all.includes("mypy ."));
});

test("dependency-cruiser runs with the baseline when present", () => {
  const repo = makeRepo({
    ...ts,
    "package.json": {},
    "pnpm-lock.yaml": "",
    ".dependency-cruiser.cjs": "module.exports={}",
    ".dependency-cruiser-known-violations.json": "[]",
  });
  assert.ok(commands(plan(repo)).some((c) => /depcruise src --config .dependency-cruiser.cjs --output-type err --ignore-known/.test(c)));
});

test("explicit verify commands in craft.json replace detection", () => {
  const repo = makeRepo({ ...ts, "package.json": { scripts: { lint: "x" } }, ".claude/craft.json": { verify: ["echo hi"], fix: ["echo fix"] } });
  const steps = plan(repo);
  assert.deepEqual(commands(steps, "check"), ["echo hi"]);
  assert.deepEqual(commands(steps, "fix"), ["echo fix"]);
});

test("verify:false and CRAFT_VERIFY=off disable checks", () => {
  const files = { ...ts, "package.json": { scripts: { lint: "x" } } };
  assert.deepEqual(plan(makeRepo({ ...files, ".claude/craft.json": { verify: false } })), []);
  assert.deepEqual(plan(makeRepo(files), { CRAFT_VERIFY: "off" }), []);
});

test("nothing changed means nothing to run", () => {
  assert.deepEqual(plan(makeRepo({}, {})), []);
});
