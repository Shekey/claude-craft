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

const SMALL_TIER_MAX = 50;
const FOLDER_FLAG = 20;
const FILE_LINES_FLAG = 400;
const COMPONENTS_FLAG = 5;
const COMPONENT_FILE_LINES = 150;
const SHARED_FILE_COMPONENTS = 3;
const PATTERN_MIN_FILES = 3;
const PATTERN_SHARE = 0.25;
const COMPONENT = /^(?:export\s+)?(?:default\s+)?(?:function\s+[A-Z][a-z]\w*|const\s+[A-Z][a-z]\w*\s*[=:]|class\s+[A-Z][a-z]\w*\s+extends\b)/gm;
const UI_KIT = /(^|\/)(shared|common|components|design-system)\/ui(\/|\.[jt]sx$)|(^|\/)(ui-kit|design-system)\//i;
const COMPOSABLE = /@Composable\s+(?:\w+\s+)*fun\s+[A-Z]/g;

function components(file, text) {
  if (/\.[jt]sx$/i.test(file)) return (text.match(COMPONENT) ?? []).length;
  if (/\.kt$/i.test(file)) return (text.match(COMPOSABLE) ?? []).length;
  return 0;
}

const ROUTE_LINES_FLAG = 80;
const ROUTE_COMPONENTS_FLAG = 2;
const ROUTE_ELEMENTS_FLAG = 4;
const ROUTE_PATTERN_MIN = 2;
const PARAM_HOOKS = new Set(["useLocalSearchParams", "useGlobalSearchParams", "useSearchParams", "useParams", "useLoaderData", "useActionData"]);
const HOOK_CALL = /\b(use[A-Z]\w*)\s*(?:<[^>()]*>)?\s*\(/g;
const JSX_OPEN = /(?:^|[\s({>?:&|])<([A-Za-z][\w.]*)/g;
const RESERVED_EXPORTS = new Set([
  "ErrorBoundary", "unstable_settings", "generateStaticParams",
  "loader", "action", "clientLoader", "clientAction", "meta", "links", "headers", "handle", "shouldRevalidate", "HydrateFallback", "Layout",
]);
const NAMED_EXPORT = /^export\s+(?:async\s+)?(?:function\*?|const|let|var|class)\s+(\w+)/gm;
const EXPORT_LIST = /^export\s*\{([^}]*)\}/gm;

function deps(dir) {
  const pkgs = [readJson("package.json"), dir ? readJson(`${dir}/package.json`) : null];
  return Object.assign({}, ...pkgs.flatMap((p) => [p?.dependencies, p?.devDependencies]));
}

function routeMatcher(dir) {
  const all = deps(dir);
  const base = dir ? `${dir}/` : "";
  const prefixes = [];
  if ("expo-router" in all) prefixes.push(`${base}app/`, `${base}src/app/`);
  if ("@react-router/dev" in all) prefixes.push(`${base}app/routes/`);
  return (file) =>
    /\.[jt]sx?$/.test(file) &&
    prefixes.some((p) => file.startsWith(p)) &&
    !/(^|\/)(_layout|\+[\w-]+)\.[jt]sx?$|\+api\.[jt]s$/.test(file) &&
    !TEST.test(file);
}

function routeCheck(file, text, lines, count) {
  const names = [...text.matchAll(NAMED_EXPORT)].map((m) => m[1]);
  for (const m of text.matchAll(EXPORT_LIST)) {
    for (const part of m[1].split(",")) {
      const name = part.trim().replace(/^type\s+/, "").split(/\s+as\s+/).pop();
      if (name && name !== "default" && !/^type\s/.test(part.trim())) names.push(name);
    }
  }
  const exports = names.filter((n) => !RESERVED_EXPORTS.has(n));
  const hooks = [...new Set([...text.matchAll(HOOK_CALL)].map((m) => m[1]).filter((h) => !PARAM_HOOKS.has(h)))];
  const elements = [...text.matchAll(JSX_OPEN)].length;
  const reasons = [];
  if (count >= ROUTE_COMPONENTS_FLAG) reasons.push(`${count} components`);
  if (exports.length) reasons.push(`exports ${exports.join(", ")}`);
  if (hooks.length) reasons.push(`calls ${hooks.join(", ")}`);
  if (elements >= ROUTE_ELEMENTS_FLAG) reasons.push(`renders ${elements} elements`);
  if (lines >= ROUTE_LINES_FLAG) reasons.push(`${lines} lines`);
  return { exports, reasons, flag: reasons.length > 0 };
}

function layout(dir, limit) {
  const scope = dir && dir !== "." ? dir.replace(/\/$/, "") : "";
  const all = trackedFiles(scope);
  const files = all.filter((f) => !TEST.test(f));
  const perFolder = new Map();
  for (const file of files) {
    const folder = posix.dirname(file);
    perFolder.set(folder, (perFolder.get(folder) ?? 0) + 1);
  }
  const folders = [...perFolder]
    .map(([folder, count]) => ({ folder, count, flag: count >= FOLDER_FLAG }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
  const isRoute = routeMatcher(scope);
  const measured = files.slice(0, 4000).map((file) => {
    const text = readFileSync(at(file), "utf8");
    const lines = text.split("\n").length;
    const count = components(file, text);
    const flag = lines >= FILE_LINES_FLAG || (count >= COMPONENTS_FLAG && lines >= COMPONENT_FILE_LINES);
    return { file, lines, components: count, flag, route: isRoute(file) ? routeCheck(file, text, lines, count) : null };
  });
  const routeFiles = measured.filter((f) => f.route);
  const fat = routeFiles.filter((f) => f.route.flag);
  const routes = {
    files: fat.sort((a, b) => b.lines - a.lines).slice(0, limit),
    fat: fat.length,
    of: routeFiles.length,
    flag: fat.length >= ROUTE_PATTERN_MIN,
  };
  const withComponents = measured.filter((f) => f.components > 0 && !UI_KIT.test(f.file));
  const shared = withComponents.filter((f) => f.components >= SHARED_FILE_COMPONENTS);
  const sharing = {
    files: shared.length,
    of: withComponents.length,
    flag: shared.length >= PATTERN_MIN_FILES && shared.length >= withComponents.length * PATTERN_SHARE,
    examples: shared.sort((a, b) => b.components - a.components).slice(0, 5).map((f) => f.file),
  };
  const sizes = measured.sort((a, b) => Number(b.flag) - Number(a.flag) || b.lines - a.lines).slice(0, limit);
  return { codeFiles: all.length, tier: all.length <= SMALL_TIER_MAX ? "small" : "medium+", folders, files: sizes, sharing, routes };
}

function changedFiles() {
  const status = sh("git status --porcelain -uall", root);
  if (!status.ok) return [];
  return status.out
    .split("\n")
    .filter((line) => line && !line.startsWith(" D") && !line.startsWith("D "))
    .map((line) => line.slice(3).split(" -> ").pop().replace(/^"|"$/g, ""))
    .filter((f) => CODE.test(f) && !NOISE.test(f) && !TEST.test(f) && existsSync(at(f)));
}

function signals(files) {
  const nested = packages().filter((p) => p.path !== ".");
  const packageOf = (file) => nested.find((p) => file.startsWith(`${p.path}/`))?.path ?? "";
  const counts = new Map();
  for (const f of trackedFiles()) counts.set(posix.dirname(f), (counts.get(posix.dirname(f)) ?? 0) + 1);
  return files.map((file) => {
    const text = readFileSync(at(file), "utf8");
    const lines = text.split("\n").length;
    const count = components(file, text);
    const reasons = [];
    if (lines >= FILE_LINES_FLAG) reasons.push(`oversized: ${lines} lines`);
    if (count >= COMPONENTS_FLAG && lines >= COMPONENT_FILE_LINES) reasons.push(`many components: ${count} in ${lines} lines`);
    if (routeMatcher(packageOf(file))(file)) {
      const route = routeCheck(file, text, lines, count);
      if (route.flag) reasons.push(`screen in route file: ${route.reasons.join(", ")}`);
    }
    const folder = counts.get(posix.dirname(file)) ?? 0;
    if (folder >= FOLDER_FLAG) reasons.push(`crowded folder: ${folder} code files in ${posix.dirname(file)}`);
    return { file, reasons };
  });
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
} else if (command === "layout") {
  const [dir = ".", limit = "8"] = args;
  const { codeFiles, tier, folders, files, sharing, routes } = layout(dir, Number(limit) || 8);
  const mark = (flag) => (flag ? "\tflag" : "");
  process.stdout.write(
    `${[
      `code files: ${codeFiles} · size tier: ${tier} (small is up to ${SMALL_TIER_MAX} code files)`,
      "",
      `folders by code files (flag at ${FOLDER_FLAG}+)`,
      ...folders.map((f) => `${f.count}\t${f.folder}${mark(f.flag)}`),
      "",
      `files (flag at ${FILE_LINES_FLAG}+ lines, or ${COMPONENTS_FLAG}+ components in ${COMPONENT_FILE_LINES}+ lines)`,
      "lines\tcomponents\tfile",
      ...files.map((f) => `${f.lines}\t${f.components}\t${f.file}${mark(f.flag)}`),
      "",
      `repo patterns (flag at ${PATTERN_MIN_FILES}+ files and ${PATTERN_SHARE * 100}%+ of component files, UI kits excluded)`,
      `several components per file (${SHARED_FILE_COMPONENTS}+): ${sharing.files} of ${sharing.of} component files${mark(sharing.flag)}${sharing.examples.length ? ` · e.g. ${sharing.examples.join(", ")}` : ""}`,
      ...(routes.of ? [`screens in route files (${ROUTE_PATTERN_MIN}+): ${routes.fat} of ${routes.of} route files, ${routes.of - routes.fat} thin${mark(routes.flag)}`] : []),
      ...(routes.of
        ? [
            "",
            `route files (thin: one default export rendering a screen, params read at most; flag at ${ROUTE_COMPONENTS_FLAG}+ components, other exports, hooks besides params, ${ROUTE_ELEMENTS_FLAG}+ JSX elements, or ${ROUTE_LINES_FLAG}+ lines)`,
            ...(routes.files.length ? routes.files.map((f) => `${f.lines}\t${f.components}\t${f.file}\tflag · ${f.route.reasons.join(", ")}`) : ["none flagged"]),
          ]
        : []),
    ].join("\n")}\n`,
  );
} else if (command === "signals") {
  const files = (args.length ? args.map((f) => f.replace(/^\.\//, "")) : changedFiles()).filter((f) => existsSync(at(f)));
  const flagged = signals(files).filter((s) => s.reasons.length);
  process.stdout.write(
    files.length
      ? `${flagged.length ? flagged.map((s) => `${s.file}\tflag · ${s.reasons.join(" · ")}`).join("\n") : `no flags in ${files.length} file(s)`}\n`
      : "no changed code files\n",
  );
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
  process.stderr.write("Usage: repo.mjs [paths | stack | mark | packages | hotspots <dir> [limit] | layout <dir> [limit] | signals [files] | backlog [roadmap|check]]\n");
  process.exit(1);
}
