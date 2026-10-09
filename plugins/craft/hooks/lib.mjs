import { execSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { basename, join, posix } from "node:path";

export async function readInput() {
  if (process.stdin.isTTY) return {};
  let raw = "";
  for await (const chunk of process.stdin) raw += chunk;
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function stripAnsi(text) {
  return text.replace(/\u001b\[[0-9;]*[A-Za-z]/g, "");
}

export function sh(command, cwd, timeout = 600_000) {
  try {
    const out = execSync(command, {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      timeout,
      maxBuffer: 32 * 1024 * 1024,
      env: { ...process.env, CI: "1", FORCE_COLOR: "0", NO_COLOR: "1" },
    });
    return { ok: true, out: stripAnsi(out) };
  } catch (error) {
    return { ok: false, out: stripAnsi(`${error.stdout ?? ""}${error.stderr ?? ""}` || String(error.message)) };
  }
}

export function isGitRepo(cwd) {
  return sh("git rev-parse --is-inside-work-tree", cwd).ok;
}

export function block(message) {
  process.stderr.write(message);
  process.exit(2);
}

function readJsonFile(file) {
  try {
    return existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : {};
  } catch {
    return {};
  }
}

export function repoKeyFromRemote(url) {
  return url
    .trim()
    .replace(/^[a-z+]+:\/\//i, "")
    .replace(/^[^@/]+@/, "")
    .replace(/\.git$/i, "")
    .replace(/\/+$/, "")
    .replace(/[:/]+/g, "-")
    .replace(/[^a-z0-9._-]/gi, "_")
    .toLowerCase();
}

export function repoContext(cwd) {
  const top = sh("git rev-parse --show-toplevel", cwd);
  if (!top.ok) return null;
  const root = top.out.trim();
  const remote = sh("git config --get remote.origin.url", root);
  const key =
    remote.ok && remote.out.trim()
      ? repoKeyFromRemote(remote.out)
      : `${basename(root).toLowerCase()}-${createHash("sha1").update(root).digest("hex").slice(0, 8)}`;

  const home = process.env.CRAFT_HOME || join(homedir(), ".claude", "craft");
  const cacheDir = join(home, "repos", key);
  const repoDir = join(root, ".claude");

  const repoConventions = join(repoDir, "conventions.md");
  const cacheConventions = join(cacheDir, "conventions.md");
  const conventionsShared = existsSync(repoConventions);

  return {
    root,
    key,
    cacheDir,
    conventions: conventionsShared ? repoConventions : cacheConventions,
    conventionsShared,
    configFile: existsSync(join(repoDir, "craft.json")) ? join(repoDir, "craft.json") : join(cacheDir, "craft.json"),
    stateFile: join(cacheDir, "state.json"),
    findingsFile: join(cacheDir, "findings.md"),
    config: { ...readJsonFile(join(cacheDir, "craft.json")), ...readJsonFile(join(repoDir, "craft.json")) },
    state: readJsonFile(join(cacheDir, "state.json")),
  };
}

export const MARKERS = {
  node: ["package.json"],
  gradle: ["settings.gradle.kts", "settings.gradle", "gradlew"],
  python: ["pyproject.toml"],
  go: ["go.mod"],
  rust: ["Cargo.toml"],
};

export const PACKS = {
  "react-native": "react-native.md",
  next: "nextjs.md",
  react: "react.md",
  nestjs: "nestjs.md",
  kotlin: "kotlin-java.md",
  java: "kotlin-java.md",
};

const JVM_BUILD = new Set(["settings.gradle.kts", "settings.gradle", "build.gradle.kts", "build.gradle", "pom.xml"]);
const IGNORED = /(^|\/)(node_modules|vendor|dist|build|\.next|\.expo|fixtures?|__fixtures__|evals?|examples?|testdata)\//;

function nodeStack(pkg) {
  const deps = { ...pkg.peerDependencies, ...pkg.devDependencies, ...pkg.dependencies };
  if ("expo" in deps || "react-native" in deps) return "react-native";
  if ("next" in deps) return "next";
  if ("@nestjs/core" in deps) return "nestjs";
  if ("react" in deps) return "react";
  return "node";
}

export function detectStacks(root) {
  const listed = sh("git ls-files -co --exclude-standard", root);
  const files = listed.ok ? listed.out.split("\n").filter((f) => f && !IGNORED.test(f)) : [];
  const dirOf = (file) => (posix.dirname(file) === "." ? "" : posix.dirname(file));
  const inside = (file, dir) => !dir || file.startsWith(`${dir}/`);
  const stacks = new Map();
  const add = (stack, dir) => {
    if (!stacks.has(stack)) stacks.set(stack, []);
    if (!stacks.get(stack).includes(dir)) stacks.get(stack).push(dir);
  };

  for (const file of files.filter((f) => posix.basename(f) === "package.json")) {
    const dir = dirOf(file);
    const pkg = readJsonFile(join(root, file));
    if (pkg.workspaces || existsSync(join(root, dir, "pnpm-workspace.yaml"))) continue;
    add(nodeStack(pkg), dir);
  }

  const jvmDirs = [...new Set(files.filter((f) => JVM_BUILD.has(posix.basename(f))).map(dirOf))].sort((a, b) => a.length - b.length);
  const jvmRoots = jvmDirs.filter((dir, i) => !jvmDirs.slice(0, i).some((parent) => inside(dir, parent)));
  for (const dir of jvmRoots) {
    const own = files.filter((f) => inside(f, dir));
    const build = own.filter((f) => JVM_BUILD.has(posix.basename(f))).map((f) => readFileSync(join(root, f), "utf8")).join("\n");
    const kotlin = own.some((f) => f.endsWith(".kt")) || (!own.some((f) => f.endsWith(".java")) && /kotlin/i.test(build));
    add(kotlin ? "kotlin" : "java", dir);
  }

  return [...stacks].map(([stack, dirs]) => ({ stack, dirs: dirs.sort(), pack: PACKS[stack] ?? null }));
}
