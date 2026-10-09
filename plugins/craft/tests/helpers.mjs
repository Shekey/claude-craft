import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const hooks = join(dirname(fileURLToPath(import.meta.url)), "..", "hooks");

export function git(cwd, ...args) {
  const result = spawnSync("git", args, { cwd, encoding: "utf8" });
  if (result.status !== 0) throw new Error(`git ${args.join(" ")}: ${result.stderr}`);
  return result.stdout;
}

export function makeRepo(files = {}, { commit = true } = {}) {
  const dir = mkdtempSync(join(tmpdir(), "craft-test-"));
  git(dir, "init", "-q");
  git(dir, "config", "user.email", "dev@example.com");
  git(dir, "config", "user.name", "Dev");
  if (commit) {
    writeFileSync(join(dir, ".gitkeep"), "");
    git(dir, "add", "-A");
    git(dir, "commit", "-qm", "init");
  }
  write(dir, files);
  return dir;
}

export function write(dir, files) {
  for (const [name, content] of Object.entries(files)) {
    const target = join(dir, name);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, typeof content === "string" ? content : JSON.stringify(content, null, 2));
  }
}

export function run(script, { cwd, input = {}, env = {} }) {
  const home = mkdtempSync(join(tmpdir(), "craft-home-"));
  const result = spawnSync("node", [join(hooks, script)], {
    cwd,
    input: JSON.stringify({ cwd, ...input }),
    encoding: "utf8",
    env: { ...process.env, CRAFT_HOME: home, ...env },
  });
  return { code: result.status, out: result.stdout, err: result.stderr };
}

export function plan(cwd, env = {}) {
  const { out } = run("verify.mjs", { cwd, env: { CRAFT_VERIFY: "plan", ...env } });
  return out
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const [kind, dir, command] = line.split("\t");
      return { kind, dir, command };
    });
}

export const commands = (steps, kind) => steps.filter((s) => !kind || s.kind === kind).map((s) => s.command);
