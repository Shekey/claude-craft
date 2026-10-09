import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { detectStacks, readInput, repoContext, sh } from "./lib.mjs";

const LEVELS = ["lite", "full", "ultra", "off"];
const IMPROVE = {
  fix: "fix small problems in files the task touches, each in its own commit; anything wider goes to the backlog",
  record: "change nothing beyond the task; add every improvement to the backlog instead (repo not owned by the user)",
  off: "skip the while-here step",
};
const STALE_AFTER_COMMITS = 50;

const input = await readInput();
const cwd = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();
const pluginRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const helper = join(pluginRoot, "hooks", "repo.mjs");
const context = repoContext(cwd);

const level = [context?.config.lean, process.env.CLAUDE_PLUGIN_OPTION_LEAN_LEVEL, "full"].find((value) =>
  LEVELS.includes(value),
);

const sections = [readFileSync(join(pluginRoot, "principles.md"), "utf8")];

function staleness() {
  const commit = context.state.conventionsCommit;
  if (!commit || context.conventionsShared) return "";
  const count = sh(`git rev-list --count ${commit}..HEAD`, context.root);
  const behind = count.ok ? Number(count.out.trim()) : 0;
  return behind >= STALE_AFTER_COMMITS
    ? `\nThese conventions were recorded ${behind} commits ago. Before relying on a section, re-check it against the code the current task touches, update the file if it changed, then run \`node "${helper}" mark\`.`
    : "";
}

if (!context) {
  sections.push("Not a git repository: craft conventions and verification are inactive.");
} else {
  const where = context.conventionsShared
    ? `${context.conventions} (committed in the repo, shared with the team)`
    : `${context.conventions} (craft's local cache for this repo, outside the repo)`;
  sections.push(
    [
      "# Craft repo context",
      `- Repo key: ${context.key}`,
      `- Conventions file: ${where}`,
      `- Settings file: ${context.configFile}`,
      `- After writing or updating conventions, run: node "${helper}" mark`,
      "- Write craft files to these paths. Do not create .claude/ files inside the repo unless the user asks to share them with the team.",
    ].join("\n"),
  );
  if (existsSync(context.conventions)) {
    sections.push(`# This repo's conventions\n\n${readFileSync(context.conventions, "utf8")}${staleness()}`);
  } else {
    sections.push(
      "No conventions recorded for this repo yet. On the first coding task, run craft:adapt (existing code) or craft:greenfield (empty repo) and write them to the conventions file above.",
    );
  }
}

function stackSection() {
  const stacks = detectStacks(context.root);
  if (JSON.stringify(stacks) !== JSON.stringify(context.state.stacks ?? [])) {
    mkdirSync(context.cacheDir, { recursive: true });
    writeFileSync(context.stateFile, `${JSON.stringify({ ...context.state, stacks }, null, 2)}\n`);
  }
  if (!stacks.length) return "";
  const lines = stacks.map(({ stack, dirs, pack }) => {
    const shown = dirs.slice(0, 4).map((d) => d || ".");
    const where = dirs.length > 4 ? `${shown.join(", ")} and ${dirs.length - 4} more` : shown.join(", ");
    return pack ? `- ${stack} (${where}): read ${join(pluginRoot, "stacks", pack)} before writing code there` : `- ${stack} (${where}): no stack pack, follow the conventions`;
  });
  return `# Stacks in this repo\n${lines.join("\n")}\nThe repo's conventions and config win over a stack pack wherever they differ.`;
}

if (context) {
  const stacks = stackSection();
  if (stacks) sections.push(stacks);
  const improve = IMPROVE[context.config.improve] ? context.config.improve : "fix";
  sections.push(`Improve mode: ${improve}: ${IMPROVE[improve]}. Set \`improve\` (fix, record, off) in the settings file to change it for this repo.`);
}

sections.push(`Active lean level: ${level}. The user can change it with /craft:lean <lite|full|ultra|off>.`);

process.stdout.write(
  JSON.stringify({
    hookSpecificOutput: { hookEventName: "SessionStart", additionalContext: sections.join("\n\n") },
  }),
);
