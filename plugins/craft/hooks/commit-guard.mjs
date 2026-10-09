import { block, isGitRepo, readInput, sh } from "./lib.mjs";

const AI_MARKER =
  /co-authored-by:[^\n]*(claude|anthropic|openai|copilot|cursor|noreply@)|generated (with|by)|🤖|\bclaude\b|\banthropic\b|claude\.ai|\bai[- ]assisted\b/i;

const COMMENT_START = /^\s*(\/\/+|\/\*+|\*(?!\/)|#(?![!\[])|--|<!--)\s*/;
const NARRATION_START =
  /^(added|adding|add|updated|update|changed|change|fixed|fix|removed|remove|refactored|refactor|modified|new|now|previously|todo|fixme|hack|xxx|note: (this|i|we) (was|were|now|changed))\b/i;
const NARRATION_ANYWHERE = /\b(as requested|per (your|the user'?s?) request|was changed to|instead of the old|claude|\bai\b)/i;

function isNarrationComment(text) {
  const match = text.match(COMMENT_START);
  if (!match) return false;
  const body = text.slice(match[0].length);
  return NARRATION_START.test(body) || NARRATION_ANYWHERE.test(body);
}
const SKIP_FILES = /\.(md|mdx|markdown|txt|rst|adoc|lock|snap|svg)$|(^|\/)(CHANGELOG|LICENSE)/i;

const input = await readInput();
const command = input.tool_input?.command ?? "";
const cwd = input.cwd ?? process.cwd();

const isCommit = /\bgit\b[^|;&]*\bcommit\b/.test(command);
const isPush = /\bgit\b[^|;&]*\bpush\b/.test(command);

if ((!isCommit && !isPush) || !isGitRepo(cwd)) process.exit(0);

if (isCommit && AI_MARKER.test(command)) {
  block(
    "Blocked: the commit message mentions AI or carries an AI trailer. Rewrite it the way a human engineer on this repo would (see craft:commit) with no Co-Authored-By AI line, no 'Generated with', no emoji.",
  );
}

if (isCommit) {
  const stagesAll = /\scommit\b[^|;&]*\s-(a|[a-z]*a[a-z]*)\b|--all\b/.test(command);
  const diff = sh(`git diff ${stagesAll ? "HEAD" : "--cached"} -U0 --no-color`, cwd).out ?? "";
  const offenders = [];
  let file = "";
  for (const line of diff.split("\n")) {
    if (line.startsWith("+++ ")) file = line.replace(/^\+\+\+ (b\/)?/, "");
    else if (line.startsWith("+") && !SKIP_FILES.test(file)) {
      const added = line.slice(1);
      if (isNarrationComment(added) || AI_MARKER.test(added)) offenders.push(`${file}: ${added.trim()}`);
    }
  }
  if (offenders.length) {
    block(
      `Blocked: staged changes add narration or AI-marker comments. Remove them (keep only genuine why-comments), restage, then commit.\n${offenders
        .slice(0, 20)
        .map((o) => `  - ${o}`)
        .join("\n")}`,
    );
  }
}

if (isPush) {
  const log = sh("git log --branches --not --remotes --format=%B", cwd);
  if (log.ok && AI_MARKER.test(log.out)) {
    block(
      "Blocked: unpushed commits mention AI or carry an AI trailer. Reword them (git rebase -i / commit --amend) per craft:commit before pushing.",
    );
  }
}

process.exit(0);
