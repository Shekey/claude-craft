import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, posix } from "node:path";
import { MARKERS, readInput, repoContext, sh } from "./lib.mjs";

const MAX_ATTEMPTS = 3;
const CODE = /\.(m?[jt]sx?|c[jt]s|vue|svelte|astro|json|jsonc|css|scss|less|html|graphql|kts?|java|gradle|py|pyi|go|rs)$/i;
const SCRIPT = /\.(m?[jt]sx?|c[jt]s|vue|svelte|astro)$/i;
const FORMATTABLE = /\.(m?[jt]sx?|c[jt]s|vue|svelte|astro|json|jsonc|css|scss|less|html|graphql)$/i;
const ESLINT_CONFIGS = ["eslint.config.js", "eslint.config.mjs", "eslint.config.cjs", "eslint.config.ts", ".eslintrc", ".eslintrc.js", ".eslintrc.cjs", ".eslintrc.json", ".eslintrc.yml", ".eslintrc.yaml"];
const PRETTIER_CONFIGS = [".prettierrc", ".prettierrc.json", ".prettierrc.js", ".prettierrc.cjs", ".prettierrc.mjs", ".prettierrc.yml", ".prettierrc.yaml", ".prettierrc.toml", "prettier.config.js", "prettier.config.cjs", "prettier.config.mjs", "prettier.config.ts"];
const VITEST_CONFIGS = ["vitest.config.ts", "vitest.config.mts", "vitest.config.js", "vitest.config.mjs", "vitest.workspace.ts"];
const DEPCRUISE_CONFIGS = [".dependency-cruiser.cjs", ".dependency-cruiser.js", ".dependency-cruiser.mjs", ".dependency-cruiser.json"];
const DEPCRUISE_BASELINE = ".dependency-cruiser-known-violations.json";
const ARCH_SCRIPTS = ["lint:arch", "check:arch", "arch", "depcruise", "lint:deps", "deps:check"];
const JEST_CONFIGS = ["jest.config.js", "jest.config.ts", "jest.config.cjs", "jest.config.mjs", "jest.config.json"];
const PREFERRED = [
  [/\.(kts?|java|gradle)$/i, "gradle"],
  [/\.pyi?$/i, "python"],
  [/\.go$/i, "go"],
  [/\.rs$/i, "rust"],
];

const input = await readInput();
if (process.env.CRAFT_VERIFY === "off") process.exit(0);

const context = repoContext(input.cwd ?? process.cwd());
if (!context) process.exit(0);
const { root, config } = context;
if (config.verify === false) process.exit(0);

const status = sh("git status --porcelain -uall", root);
const changed = status.ok
  ? status.out
      .split("\n")
      .filter(Boolean)
      .map((line) => line.slice(3).split(" -> ").pop().replace(/^"|"$/g, ""))
      .filter((file) => CODE.test(file))
  : [];
if (!changed.length) process.exit(0);

const path = (dir, file = "") => join(root, dir, file);
const exists = (dir, file) => existsSync(path(dir, file));
const hasAny = (dir, files) => files.some((file) => exists(dir, file));
const read = (dir, file) => (exists(dir, file) ? readFileSync(path(dir, file), "utf8") : "");
const readJson = (dir, file) => {
  try {
    return JSON.parse(read(dir, file) || "null");
  } catch {
    return null;
  }
};
const quote = (files) => files.map((f) => `'${f.replace(/'/g, "'\\''")}'`).join(" ");


function ownerOf(file) {
  const preferred = PREFERRED.find(([pattern]) => pattern.test(file))?.[1];
  const order = preferred ? [preferred, ...Object.keys(MARKERS).filter((t) => t !== preferred)] : Object.keys(MARKERS);
  let dir = posix.dirname(file);
  for (;;) {
    const here = dir === "." ? "" : dir;
    const type = order.find((t) => hasAny(here, MARKERS[t]));
    if (type) return { type, dir: here };
    if (!here) return null;
    dir = posix.dirname(dir);
  }
}

function groupProjects() {
  const projects = new Map();
  for (const file of changed) {
    const owner = ownerOf(file);
    if (!owner) continue;
    const key = `${owner.type}:${owner.dir}`;
    if (!projects.has(key)) projects.set(key, { ...owner, files: [] });
    projects.get(key).files.push(file);
  }
  return [...projects.values()];
}

function packageManager(dir) {
  for (const at of [dir, ""]) {
    if (exists(at, "pnpm-lock.yaml")) return "pnpm";
    if (exists(at, "yarn.lock")) return "yarn";
    if (exists(at, "bun.lockb") || exists(at, "bun.lock")) return "bun";
    if (exists(at, "package-lock.json")) return "npm";
  }
  return "pnpm";
}

const rootPm = packageManager("");
const execFor = (pm) => ({ pnpm: "pnpm exec", yarn: "yarn", bun: "bunx", npm: "npx --no --" })[pm];
const rootExec = execFor(rootPm);
const turbo = readJson("", "turbo.json");
const usesNx = exists("", "nx.json");
const isMonorepo = Boolean(turbo) || usesNx || exists("", "pnpm-workspace.yaml") || Boolean(readJson("", "package.json")?.workspaces);

const steps = [];
const add = (cwd, command, kind) => {
  if (!steps.some((s) => s.cwd === cwd && s.command === command)) steps.push({ cwd, command, kind });
};

function monorepoChecks() {
  if (turbo) {
    const defined = Object.keys(turbo.tasks ?? turbo.pipeline ?? {});
    const tasks = ["check", "lint", "typecheck", "type-check"].filter((t) => defined.includes(t));
    if (tasks.length) {
      add("", `${rootExec} turbo run ${tasks.join(" ")} '--filter=...[HEAD]' --output-logs=errors-only`, "check");
      return true;
    }
  }
  if (usesNx) {
    add("", `${rootExec} nx affected -t lint,typecheck --uncommitted --untracked --output-style=static`, "check");
    return true;
  }
  return false;
}

function nodeSteps({ dir, files }, lintAndTypesDone) {
  const pkg = readJson(dir, "package.json") ?? {};
  const rootPkg = readJson("", "package.json") ?? {};
  const scripts = pkg.scripts ?? {};
  const deps = { ...rootPkg.dependencies, ...rootPkg.devDependencies, ...pkg.dependencies, ...pkg.devDependencies };
  const pm = packageManager(dir);
  const exec = execFor(pm);
  const run = (script) => `${pm} run ${script}`;
  const near = (configs) => hasAny(dir, configs) || hasAny("", configs);
  const local = files.map((f) => posix.relative(dir || ".", f)).filter((f) => existsSync(path(dir, f)));
  const formattable = local.filter((f) => FORMATTABLE.test(f));
  const scriptFiles = local.filter((f) => SCRIPT.test(f));

  const biome = near(["biome.json", "biome.jsonc"]);
  const eslint = near(ESLINT_CONFIGS) || "eslintConfig" in pkg || "eslintConfig" in rootPkg;
  const prettier = near(PRETTIER_CONFIGS) || "prettier" in pkg || "prettier" in rootPkg;

  if (biome && formattable.length) add(dir, `${exec} biome check --write --no-errors-on-unmatched ${quote(formattable)}`, "fix");
  if (!biome && eslint && scriptFiles.length) add(dir, `${exec} eslint --fix ${quote(scriptFiles)}`, "fix");
  if (!biome && prettier && formattable.length) add(dir, `${exec} prettier --write --ignore-unknown ${quote(formattable)}`, "fix");
  if (!biome && !eslint && !prettier && scripts.format) add(dir, run("format"), "fix");

  if (!lintAndTypesDone) {
    if (scripts.check) add(dir, run("check"), "check");
    else if (scripts.lint) add(dir, run("lint"), "check");
    else if (biome && formattable.length) add(dir, `${exec} biome check --no-errors-on-unmatched ${quote(formattable)}`, "check");
    else if (eslint && scriptFiles.length) add(dir, `${exec} eslint ${quote(scriptFiles)}`, "check");

    const typecheck = ["typecheck", "type-check", "tsc"].find((s) => scripts[s]);
    if (typecheck) add(dir, run(typecheck), "check");
    else if (exists(dir, "tsconfig.json")) add(dir, `${exec} tsc --noEmit -p tsconfig.json`, "check");
  }

  const archScript = ARCH_SCRIPTS.find((s) => scripts[s]);
  if (archScript) add(dir, run(archScript), "check");
  else {
    const configDir = hasAny(dir, DEPCRUISE_CONFIGS) ? dir : hasAny("", DEPCRUISE_CONFIGS) ? "" : null;
    if (configDir !== null) {
      const configFile = DEPCRUISE_CONFIGS.find((f) => exists(configDir, f));
      const target = exists(configDir, "src") ? "src" : ".";
      const baseline = exists(configDir, DEPCRUISE_BASELINE) ? ` --ignore-known ${DEPCRUISE_BASELINE}` : "";
      add(configDir, `${execFor(packageManager(configDir))} depcruise ${target} --config ${configFile} --output-type err${baseline}`, "check");
    }
  }
  if ("steiger" in deps && scripts["lint:fsd"]) add(dir, run("lint:fsd"), "check");

  const hasTestScript = scripts.test && !/no test specified/.test(scripts.test);
  const vitest = "vitest" in deps || near(VITEST_CONFIGS);
  const jest = "jest" in deps || near(JEST_CONFIGS) || "jest" in pkg;
  if (config.tests === "full" || !scriptFiles.length) {
    if (hasTestScript && scriptFiles.length) add(dir, run("test"), "check");
  } else if (vitest) {
    add(dir, `${exec} vitest related --run --passWithNoTests ${quote(scriptFiles)}`, "check");
  } else if (jest) {
    add(dir, `${exec} jest --passWithNoTests --findRelatedTests ${quote(scriptFiles)}`, "check");
  } else if (hasTestScript) {
    add(dir, run("test"), "check");
  }
}

function gradleSteps({ dir }) {
  const gradle = exists(dir, "gradlew") ? "./gradlew" : "gradle";
  const build = ["build.gradle.kts", "build.gradle", "app/build.gradle.kts", "app/build.gradle"].map((f) => read(dir, f)).join("\n");
  if (/spotless/i.test(build)) add(dir, `${gradle} spotlessApply -q`, "fix");
  else if (/ktlint/i.test(build)) add(dir, `${gradle} ktlintFormat -q`, "fix");
  add(dir, `${gradle} check -q --console=plain`, "check");
}

function pythonSteps({ dir }) {
  const runner = exists(dir, "uv.lock") ? "uv run " : exists(dir, "poetry.lock") ? "poetry run " : "";
  const pyproject = read(dir, "pyproject.toml");
  add(dir, `${runner}ruff format .`, "fix");
  add(dir, `${runner}ruff check --fix .`, "fix");
  add(dir, `${runner}ruff check .`, "check");
  if (/\[tool\.mypy\]/.test(pyproject)) add(dir, `${runner}mypy .`, "check");
  if (/\[tool\.pyright\]/.test(pyproject)) add(dir, `${runner}pyright`, "check");
  if (/\[tool\.importlinter\]/.test(pyproject) || exists(dir, ".importlinter")) add(dir, `${runner}lint-imports`, "check");
  if (/pytest/.test(pyproject) || exists(dir, "tests")) add(dir, `${runner}pytest -q`, "check");
}

function goSteps({ dir, files }) {
  const local = files.map((f) => posix.relative(dir || ".", f)).filter((f) => f.endsWith(".go"));
  const packages = [...new Set(local.map((f) => `./${posix.dirname(f)}`.replace(/\/\.$/, "")))];
  const existing = local.filter((f) => existsSync(path(dir, f)));
  if (existing.length) add(dir, `gofmt -w ${quote(existing)}`, "fix");
  const targets = packages.length ? quote(packages) : "./...";
  add(dir, `go vet ${targets}`, "check");
  if (hasAny(dir, [".golangci.yml", ".golangci.yaml", ".golangci.toml", ".golangci.json"])) add(dir, `golangci-lint run ${targets}`, "check");
  add(dir, `go test ${targets}`, "check");
}

function rustSteps({ dir }) {
  add(dir, "cargo fmt", "fix");
  add(dir, "cargo clippy --all-targets -q -- -D warnings", "check");
  add(dir, "cargo test -q", "check");
}

function planSteps() {
  if (Array.isArray(config.verify)) {
    for (const command of config.fix ?? []) add("", command, "fix");
    for (const command of config.verify) add("", command, "check");
    return;
  }
  const projects = groupProjects();
  const monorepoHandled = isMonorepo && projects.some((p) => p.type === "node") && monorepoChecks();
  for (const project of projects) {
    if (project.type === "node") nodeSteps(project, monorepoHandled);
    if (project.type === "gradle") gradleSteps(project);
    if (project.type === "python") pythonSteps(project);
    if (project.type === "go") goSteps(project);
    if (project.type === "rust") rustSteps(project);
  }
  if (!projects.length && /^check:/m.test(read("", "Makefile"))) add("", "make check", "check");
}

planSteps();
if (process.env.CRAFT_VERIFY === "plan") {
  process.stdout.write(`${steps.map((s) => `${s.kind}\t${s.cwd || "."}\t${s.command}`).join("\n")}\n`);
  process.exit(0);
}
if (!steps.length) process.exit(0);

for (const step of steps.filter((s) => s.kind === "fix")) sh(step.command, path(step.cwd));

const failures = [];
for (const step of steps.filter((s) => s.kind === "check")) {
  const result = sh(step.command, path(step.cwd));
  if (result.ok && /depcruise/.test(step.command) && /\b0 modules\b/.test(result.out)) {
    result.ok = false;
    result.out = `dependency-cruiser analysed 0 modules, so the boundary check proved nothing. Check the path and config; for TypeScript sources it needs a typescript package below version 7 installed (e.g. add typescript@^6 as a dev dependency next to TypeScript 7).\n${result.out}`;
  }
  if (!result.ok) {
    failures.push({ label: `${step.cwd ? `(${step.cwd}) ` : ""}$ ${step.command}`, tail: result.out.trim().split("\n").slice(-60).join("\n") });
  }
}

const counterFile = join(tmpdir(), `craft-verify-${input.session_id ?? "default"}`);
const attempts = existsSync(counterFile) ? Number(readFileSync(counterFile, "utf8")) || 0 : 0;

if (!failures.length) {
  writeFileSync(counterFile, "0");
  process.exit(0);
}

if (attempts >= MAX_ATTEMPTS) {
  writeFileSync(counterFile, "0");
  process.stdout.write(
    JSON.stringify({
      systemMessage: `craft verify still failing after ${MAX_ATTEMPTS} fix attempts: ${failures.map((f) => f.label).join(", ")}`,
    }),
  );
  process.exit(0);
}

writeFileSync(counterFile, String(attempts + 1));
process.stderr.write(
  `Verification failed (attempt ${attempts + 1}/${MAX_ATTEMPTS}). Fix the root cause of each failure below, without disabling rules, skipping tests or adding ignore comments, then finish again.\n\n${failures
    .map((f) => `${f.label}\n${f.tail}`)
    .join("\n\n")}`,
);
process.exit(2);
