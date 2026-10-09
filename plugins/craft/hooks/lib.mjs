import { execSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { basename, join } from "node:path";

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
