import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, posix } from "node:path";
import { fileURLToPath } from "node:url";
import { check as checkBacklog, render as renderRoadmap, roadmap } from "./backlog.mjs";
import { detectStacks, repoContext, sh } from "./lib.mjs";

const CODE = /\.(m?[jt]sx?|c[jt]s|vue|svelte|astro|kts?|java|py|go|rs|swift)$/i;
const NOISE = /(^|\/)(node_modules|dist|build|\.next|\.expo|coverage|vendor|generated|__generated__)\/|\.d\.ts$|\.min\.js$|(^|\/)(build|settings)\.gradle(\.kts)?$|\.config\.[cm]?[jt]s$/;
const TEST = /(\.|_)(test|spec)\.|(^|\/)(__tests__|tests?)\//i;
const SMELL = /\b(useState|useRef|useReducer|useEffect|useLayoutEffect|useCallback|useMemo|mutableStateOf|MutableStateFlow|MutableLiveData|@State|@Published|setState)\b/g;
const IMPORT = /(?:from|require\(|import\()\s*["']([^"']+)["']/g;
const ENTRY = /(^|\/)(app|pages|routes|screens|views|controllers|handlers|api)\/|(page|layout|route|screen|controller|handler|activity|fragment|viewmodel)\.[a-z]+$/i;

const [command = "paths", ...args] = process.argv.slice(2);
const context = repoContext(process.cwd());

if (!context) {
  process.stderr.write("Not inside a git repository.\n");
  process.exit(1);
}

const { root } = context;
const at = (...parts) => join(root, ...parts);
const read = (file) => (existsSync(at(file)) ? readFileSync(at(file), "utf8") : "");
const readJson = (file) => {
  try {
    return JSON.parse(read(file) || "null");
  } catch {
    return null;
  }
};

function trackedFiles(dir = "") {
  const out = sh(`git ls-files -co --exclude-standard ${dir ? `'${dir}'` : ""}`, root);
  return out.ok ? out.out.split("\n").filter((f) => f && CODE.test(f) && !NOISE.test(f)) : [];
}

function expandGlob(pattern) {
  const clean = pattern.replace(/^\.\//, "").replace(/\/$/, "");
  if (!clean.includes("*")) return existsSync(at(clean)) ? [clean] : [];
  const [base] = clean.split("/*");
  const recursive = clean.includes("**");
  const found = [];
  const walk = (dir, depth) => {
    if (!existsSync(at(dir))) return;
    for (const entry of readdirSync(at(dir), { withFileTypes: true })) {
      if (!entry.isDirectory() || entry.name === "node_modules" || entry.name.startsWith(".")) continue;
      const child = posix.join(dir, entry.name);
      found.push(child);
      if (recursive && depth < 3) walk(child, depth + 1);
    }
  };
  walk(base, 0);
  return found;
}

function nodeWorkspaceGlobs() {
  const yaml = read("pnpm-workspace.yaml");
  const fromYaml = [...yaml.matchAll(/^\s*-\s*["']?([^"'\n#]+)["']?/gm)].map((m) => m[1].trim());
  const workspaces = readJson("package.json")?.workspaces;
  const fromPkg = Array.isArray(workspaces) ? workspaces : (workspaces?.packages ?? []);
  return [...fromYaml, ...fromPkg];
}

function packages() {
  const found = new Map();
  const addPackage = (path, kind, name) => {
    if (!found.has(path)) found.set(path, { path, kind, name: name ?? posix.basename(path) });
  };

  const globs = nodeWorkspaceGlobs();
  const excluded = new Set(globs.filter((g) => g.startsWith("!")).flatMap((g) => expandGlob(g.slice(1))));
  for (const dir of globs.filter((g) => !g.startsWith("!")).flatMap(expandGlob)) {
    if (!excluded.has(dir) && existsSync(at(dir, "package.json"))) addPackage(dir, "node", readJson(`${dir}/package.json`)?.name);
  }

  for (const settings of ["settings.gradle.kts", "settings.gradle", "android/settings.gradle.kts", "android/settings.gradle"]) {
    const base = posix.dirname(settings) === "." ? "" : posix.dirname(settings);
    for (const match of read(settings).matchAll(/include\s*\(?([^)\n]+)\)?/g)) {
      for (const module of match[1].matchAll(/["']:?([^"']+)["']/g)) {
        const dir = posix.join(base, module[1].replace(/:/g, "/"));
        if (existsSync(at(dir))) addPackage(dir, "gradle", `:${module[1]}`);
      }
    }
  }

  for (const match of read("go.work").matchAll(/^\s*(?:use\s+)?(\.\/[^\s)]+)/gm)) addPackage(match[1].replace(/^\.\//, ""), "go");

  const cargoMembers = read("Cargo.toml").match(/\[workspace\][\s\S]*?members\s*=\s*\[([^\]]*)\]/);
  if (cargoMembers) for (const m of cargoMembers[1].matchAll(/["']([^"']+)["']/g)) for (const dir of expandGlob(m[1])) addPackage(dir, "rust");

  if (!found.size) addPackage(".", "single", readJson("package.json")?.name ?? posix.basename(root));

  const files = trackedFiles();
  const list = [...found.values()].sort((a, b) => b.path.length - a.path.length);
  const counts = new Map(list.map((p) => [p.path, 0]));
  for (const file of files) {
    const owner = list.find((p) => p.path === "." || file.startsWith(`${p.path}/`));
    if (owner) counts.set(owner.path, counts.get(owner.path) + 1);
  }
  return list
    .map((p) => ({ ...p, codeFiles: counts.get(p.path) }))
    .sort((a, b) => a.path.localeCompare(b.path));
}

const stemOf = (spec) => {
  const parts = spec.replace(/\/index$/, "").split("/");
  return parts[parts.length - 1].replace(/\.(m?[jt]sx?|vue|svelte)$/, "");
};

function suggestedDepth(codeFiles) {
  return codeFiles <= 60 ? 3 : codeFiles <= 150 ? 4 : codeFiles <= 400 ? 5 : 6;
}

function hotspots(dir, limit) {
  const scope = dir && dir !== "." ? dir.replace(/\/$/, "") : "";
  const all = trackedFiles(scope);
  const files = all.filter((f) => !TEST.test(f));
  const churn = new Map();
  const log = sh(`git log --since=6.months --name-only --format= -- ${scope ? `'${scope}'` : "."}`, root);
  if (log.ok) for (const f of log.out.split("\n").filter(Boolean)) churn.set(f, (churn.get(f) ?? 0) + 1);

  const fanIn = new Map();
  const info = new Map();
  for (const file of files.slice(0, 4000)) {
    const text = readFileSync(at(file), "utf8");
    info.set(file, { lines: text.split("\n").length, smells: (text.match(SMELL) ?? []).length });
    for (const match of text.matchAll(IMPORT)) {
      if (!match[1].startsWith(".") && !match[1].startsWith("@/") && !match[1].startsWith("~/")) continue;
      const stem = stemOf(match[1]);
      fanIn.set(stem, (fanIn.get(stem) ?? 0) + 1);
    }
  }

  const rows = files
    .filter((f) => info.has(f))
    .map((file) => {
      const { lines, smells } = info.get(file);
      const commits = churn.get(file) ?? 0;
      const name = stemOf(file);
      const fan = fanIn.get(name === "index" ? stemOf(posix.dirname(file)) : name) ?? 0;
      const score = Math.round(lines * (1 + commits) * (1 + smells / 8) * (1 + fan / 5));
      return { file, lines, commits, smells, fan, entry: ENTRY.test(file), score };
    })
    .sort((a, b) => b.score - a.score);
  return { rows: rows.slice(0, limit), depth: suggestedDepth(all.length), codeFiles: all.length };
}

function writeState(patch) {
  mkdirSync(context.cacheDir, { recursive: true });
  writeFileSync(context.stateFile, `${JSON.stringify({ ...context.state, ...patch }, null, 2)}\n`);
}

if (command === "paths") {
  const { key, cacheDir, conventions, conventionsShared, configFile, stateFile, findingsFile, config, state } = context;
  process.stdout.write(
    `${JSON.stringify({ root, key, cacheDir, conventions, conventionsShared, configFile, stateFile, findingsFile, config, state }, null, 2)}\n`,
  );
} else if (command === "stack") {
  const packs = join(dirname(fileURLToPath(import.meta.url)), "..", "stacks");
  const stacks = detectStacks(root).map((s) => ({ ...s, pack: s.pack && join(packs, s.pack) }));
  process.stdout.write(`${JSON.stringify(stacks, null, 2)}\n`);
} else if (command === "mark") {
  const head = sh("git rev-parse HEAD", root);
  writeState({ conventionsCommit: head.ok ? head.out.trim() : null, updatedAt: new Date().toISOString() });
  process.stdout.write(`Recorded conventions for ${context.key} at ${head.ok ? head.out.trim().slice(0, 12) : "no commit yet"}\n`);
} else if (command === "packages") {
  process.stdout.write(`${JSON.stringify(packages(), null, 2)}\n`);
} else if (command === "hotspots") {
  const [dir = ".", limit = "15"] = args;
  const { rows, depth, codeFiles } = hotspots(dir, Number(limit) || 15);
  const lines = rows.map((r) => `${r.score}\t${r.lines}\t${r.commits}\t${r.smells}\t${r.fan}\t${r.entry ? "yes" : ""}\t${r.file}`);
  process.stdout.write(`${[`code files: ${codeFiles} · suggested depth: ${depth}`, "score\tlines\tcommits(6m)\tstate-hooks\tfan-in\tentry\tfile", ...lines].join("\n")}\n`);
} else if (command === "backlog") {
  const mode = args[0] ?? "roadmap";
  if (!existsSync(context.findingsFile)) {
    process.stderr.write(`No backlog at ${context.findingsFile}. Run /craft:architect assess first.\n`);
    process.exit(1);
  }
  const { parsed, problems } = checkBacklog(readFileSync(context.findingsFile, "utf8"));
  if (mode === "check") {
    process.stdout.write(problems.length ? `${problems.map((p) => `- ${p}`).join("\n")}\n` : `OK: ${parsed.findings.length} findings\n`);
    process.exit(problems.length ? 1 : 0);
  }
  if (problems.length) process.stderr.write(`Backlog problems (fix with /craft:architect or edit ${context.findingsFile}):\n${problems.map((p) => `- ${p}`).join("\n")}\n\n`);
  process.stdout.write(renderRoadmap(roadmap(parsed)));
} else {
  process.stderr.write("Usage: repo.mjs [paths | stack | mark | packages | hotspots <dir> [limit] | backlog [roadmap|check]]\n");
  process.exit(1);
}
