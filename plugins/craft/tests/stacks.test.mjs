import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { detectStacks, PACKS } from "../hooks/lib.mjs";
import { hooks, makeRepo, run } from "./helpers.mjs";

const stacksOf = (files) => detectStacks(makeRepo(files)).map(({ stack, dirs, pack }) => ({ stack, dirs, pack }));

test("expo app picks the react native pack", () => {
  assert.deepEqual(stacksOf({ "package.json": { dependencies: { expo: "54", react: "19", "react-native": "0.81" } } }), [
    { stack: "react-native", dirs: [""], pack: "react-native.md" },
  ]);
});

test("gradle kotlin project picks the kotlin-java pack as kotlin", () => {
  assert.deepEqual(
    stacksOf({ "settings.gradle.kts": "", "app/build.gradle.kts": 'plugins { kotlin("jvm") }', "app/src/main/kotlin/App.kt": "class App\n" }),
    [{ stack: "kotlin", dirs: [""], pack: "kotlin-java.md" }],
  );
});

test("gradle java project with a kotlin DSL build is java", () => {
  assert.deepEqual(
    stacksOf({ "settings.gradle.kts": "", "build.gradle.kts": "plugins { java }", "src/main/java/App.java": "class App {}\n" }),
    [{ stack: "java", dirs: [""], pack: "kotlin-java.md" }],
  );
});

test("maven project is java", () => {
  assert.deepEqual(stacksOf({ "pom.xml": "<project/>", "src/main/java/App.java": "class App {}\n" }), [
    { stack: "java", dirs: [""], pack: "kotlin-java.md" },
  ]);
});

test("next app picks the next pack, not react", () => {
  assert.deepEqual(stacksOf({ "package.json": { dependencies: { next: "16", react: "19" } } }), [
    { stack: "next", dirs: [""], pack: "nextjs.md" },
  ]);
});

test("vite react app picks the react pack", () => {
  assert.deepEqual(stacksOf({ "package.json": { dependencies: { react: "19" }, devDependencies: { vite: "7" } } }), [
    { stack: "react", dirs: [""], pack: "react.md" },
  ]);
});

test("nest api picks the nestjs pack", () => {
  assert.deepEqual(stacksOf({ "package.json": { dependencies: { "@nestjs/core": "11", "@nestjs/common": "11" } } }), [
    { stack: "nestjs", dirs: [""], pack: "nestjs.md" },
  ]);
});

test("plain node has no pack", () => {
  assert.deepEqual(stacksOf({ "package.json": { dependencies: { zod: "4" } } }), [{ stack: "node", dirs: [""], pack: null }]);
});

test("expo app with a committed android folder has both stacks", () => {
  assert.deepEqual(
    stacksOf({
      "package.json": { dependencies: { expo: "54", "react-native": "0.81" } },
      "android/settings.gradle": "",
      "android/app/build.gradle": "apply plugin: 'com.android.application'",
      "android/app/src/main/java/com/app/MainActivity.kt": "class MainActivity\n",
    }),
    [
      { stack: "react-native", dirs: [""], pack: "react-native.md" },
      { stack: "kotlin", dirs: ["android"], pack: "kotlin-java.md" },
    ],
  );
});

test("monorepo lists each app and skips the workspace root and fixtures", () => {
  assert.deepEqual(
    stacksOf({
      "package.json": { workspaces: ["apps/*"], devDependencies: { turbo: "2" } },
      "apps/web/package.json": { dependencies: { next: "16" } },
      "apps/api/package.json": { dependencies: { "@nestjs/core": "11" } },
      "apps/api/test/fixtures/demo/package.json": { dependencies: { react: "19" } },
      "node_modules/x/package.json": { dependencies: { react: "19" } },
    }),
    [
      { stack: "nestjs", dirs: ["apps/api"], pack: "nestjs.md" },
      { stack: "next", dirs: ["apps/web"], pack: "nextjs.md" },
    ],
  );
});

test("session start names the pack to read and the improve mode", () => {
  const repo = makeRepo({ "package.json": { dependencies: { expo: "54" } }, ".claude/craft.json": { improve: "record" } });
  const context = JSON.parse(run("session-start.mjs", { cwd: repo, env: { CLAUDE_PROJECT_DIR: repo } }).out).hookSpecificOutput.additionalContext;
  assert.match(context, /react-native \(\.\): read .*stacks\/react-native\.md/);
  assert.match(context, /Improve mode: record/);
});

test("improve mode defaults to fix", () => {
  const repo = makeRepo({ "package.json": {} });
  const context = JSON.parse(run("session-start.mjs", { cwd: repo, env: { CLAUDE_PROJECT_DIR: repo } }).out).hookSpecificOutput.additionalContext;
  assert.match(context, /Improve mode: fix/);
});

test("every pack the detector names exists", () => {
  for (const pack of Object.values(PACKS)) assert.ok(existsSync(join(hooks, "..", "stacks", pack)), pack);
});
