---
name: task
description: Use first on every task in a repo, before reading code in depth or editing anything: a question or research, a bug, a feature, tests, or cleanup. Picks the path for the task type, loads the repo's conventions and stack pack, and applies craft's shared tail (improve, verify, review, commit).
argument-hint: "[what to do]"
---

# Task router

The task: `$ARGUMENTS` (or the user's last message).

## 1. Pick the path

Say the path in one line before anything else, e.g. `Path: bug`. If the user names a path, use it.

| Type | Signals | Path |
|---|---|---|
| question | how, why, where, what if, compare options, review a design; no change asked | Research rules below. No edits. |
| bug | wrong output, crash, error, regression, "doesn't work", a failing test | `craft:bug` |
| tests | add or improve tests, coverage, "make this testable" | `craft:tests` |
| cleanup | refactor, simplify, rename, restructure, no behavior change | `craft:refactor`; `craft:architect` when modules or folders move |
| feature | new or changed behavior | `craft:plan`, then implement following `craft:adapt` |

When a request mixes types, do them in this order, each with its own commits: bug, tests, cleanup, feature. A question that ends in "so change it" becomes the matching path once the answer is given.

## 2. Load context (every path)

- The repo's conventions file (craft repo context). If none exists and the path changes code, run `craft:adapt` first.
- The stack pack for the area you touch: the session context lists detected stacks and their pack files (`node "${CLAUDE_PLUGIN_ROOT}/hooks/repo.mjs" stack` prints them again). Read it before writing code there. The repo's conventions and config win over the pack wherever they differ.
- The design checklist (`craft:architect` design.md) when the path creates a unit or grows one.

## 3. Shared tail (every path that changes code)

1. **While here**: improve the code the task touched (next section).
2. **Verify**: the Stop hook runs the repo's own fix, lint, type and related-test commands for each stack touched. Fix the root cause of every failure; never disable a rule or skip a test.
3. **Review**: for a non-trivial diff, run the `craft:reviewer` agent and fix its Must fix items.
4. **Commit**: `craft:commit`. The task and each improvement are separate commits.
5. **End line**: the last line of the reply is `Improved: <what, or none> · Backlog: <IDs added, or none>`.

## While here (improve each task)

The mode comes from the repo's craft settings (`improve`), stated in the session context:
- `fix` (default): improve touched code in its own commit.
- `record`: change nothing beyond the task; put every improvement in the backlog. Use it for repos you don't own (agency or client work).
- `off`: skip this step.

While working, note problems in the code you read. Then sort them:
- **Fix now** (mode `fix` only): inside the files the task already changes, behavior-preserving, covered by tests or obviously safe, and small (about one function or 30 lines). Examples: a dead branch, a misleading name, a duplicated literal, a missing type, an unhandled promise, a D10 item. Commit it on its own (`Rename…`, `Remove unused…`), never inside the bug fix or feature commit.
- **Backlog**: anything wider: other files, behavior changes, a design finding (D1–D9), anything that needs its own tests or review. Add it to the findings backlog (`findingsFile` from `repo.mjs paths`) in the `craft:architect` finding format with the next free ID, `todo` status and real evidence, then run `node "${CLAUDE_PLUGIN_ROOT}/hooks/repo.mjs" backlog check`. Do not touch that code.

List the planned improvements in the plan's `While here` line. Lean still applies: no speculative cleanups, no style churn the repo doesn't ask for, and the repo's conventions decide what "better" means.

## Research rules (question path, and the research step of any path)

Answer from the code, not from memory. Lead with the answer, then the evidence as `path:line`. Mark anything inferred as inferred.

Spawn sub-agents only when the question spans several independent areas, or needs a sweep over many files where only the conclusion matters. A question about one module or one known location is answered directly.
- At most about 4 agents at once, each with one precise question, its scope (paths), and the expected output: a short answer with `path:line` evidence.
- Agents are read-only: the `Explore` agent or another agent without Edit or Write. They never change files, install packages or run commands with side effects.
- Verify what comes back: open the cited lines for every claim the answer depends on before you repeat it. Drop claims you cannot confirm.
- High-stakes work (security, data loss, migrations, money, a hard-to-reverse decision): optionally ask one more agent the same question with fresh context and without the first answer, and resolve any disagreement by reading the code yourself.

The question path changes no files in the repo. If research turns up something worth fixing, say so and offer the path that would fix it; in `fix` or `record` mode, add real findings to the backlog.
