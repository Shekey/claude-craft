---
name: architect
description: Use when the user wants to assess, improve, restructure or set up a codebase's architecture or code design, asks what is wrong with a codebase or a screen, wants to see or continue the architecture backlog, or when a refactor changes module or folder structure. Finds structure and design problems with evidence, keeps a findings backlog the user picks from, and works through it in safe, enforced iterations.
argument-hint: "[assess [paths] [--depth N] | plan <IDs> | status | next | enforce]"
---

# Architecture

`$ARGUMENTS` picks the mode. With no argument: `status` if a backlog exists for this repo, otherwise `assess`.

Helper (run from the repo root): `node "${CLAUDE_PLUGIN_ROOT}/hooks/repo.mjs" <paths | packages | hotspots <dir> [limit] | backlog [roadmap|check]>`. `paths` gives `findingsFile` (the backlog) and `conventions`, both in craft's per-repo cache outside the repo. If the helper cannot run, do the same with `git ls-files`, `git log` and Glob.

Design rules: [design.md](design.md). Targets and enforcement: [reference.md](reference.md).

## assess

### 1. Scope
Run `packages`. With two or more packages or apps, ask which to assess with AskUserQuestion (multiSelect), unless `$ARGUMENTS` already names paths:
- up to 4 packages: one question, one option each;
- 5 to 16: split across up to 4 questions grouped by kind (apps, shared packages, backend, native);
- more: offer the 4 with the most code files and let the user type others under "Other".
A single package or app is assessed straight away.

### 2. Measure structure
Per chosen package:
- Cycles: TS/JS `npx -y madge --circular --extensions ts,tsx,js,jsx <dir>`; Python `uvx pydeps --show-cycles --no-output <pkg>`. Skip if the tool cannot run and say so.
- Wrong-way imports: UI importing data access directly, shared code importing features, domain code importing framework or database code. In a monorepo also: an app importing another app, a package importing an app, deep imports into a package's internals instead of its public entry.
- Duplication of a concept across modules.

### 3. Read the central units
Run `hotspots <package> 15`. The score combines size, 6-month churn, state hooks and fan-in, and the first line gives a suggested depth that grows with the package's size. Read that many units per package (`--depth N` overrides), preferring entry points (screens, routes, controllers, ViewModels) and the main user flows, and also any unit scoring at least 60% of the top score. Read each one end to end, plus the local modules it imports. Apply every rule in [design.md](design.md) to it, including its "Not a finding" section. Note evidence with line ranges.

Bug pass: while reading, also record anything that looks like a real defect (a reset or invalidation that one code path ignores, a fallback to a fake value such as 0,0 or an empty id, an error swallowed, a stale closure). These are `bug` findings with severity by impact, never `minor`. If you cannot confirm it from the code you read, say "suspected" in the Problem and what to check.

### 4. Write findings
Each finding:

```
## A3 · high · design · D3 · todo
Files: app/add-item.tsx:47-49, 147
Problem: photo, existing and removePhoto allow impossible combinations; the upload payload is decided by flag checks.
Fix: one Photo union (none | saved | new) with the payload derived from it.
Effort: S · Blast: low · Tests: none · Depends on: A1 (hard: reuses the Draft type) · Batch: add-item state model
```

- Blast is how much breaks if the change is wrong: `low` (one screen or file), `medium` (several screens or a shared hook), `high` (app-wide state, public API, persisted data). Tests is whether existing tests cover the touched code: `yes`, `partial` or `none`; `none` means the batch starts with characterization tests.
- Depends on lists only real dependencies. `hard: <reason>` means the later change cannot be done or reviewed without the earlier one (a type or module it uses is introduced there). `soft: <reason>` means it is easier or cleaner afterwards but can go first. If you cannot state the reason, there is no dependency. Write `none` when there is none.
- Kind is `design`, `structure`, `bug` or `minor` (definitions in design.md). Rule IDs: D1–D10 for design and minor, `S` for structure, none for bugs. Label honestly; a severity or kind inflated to make a finding look important is a calibration failure.
- Group findings into batches: each batch is one coherent change that can ship on its own (usually one unit or one theme), ordered so dependencies come first.
- Minor findings need only Files, Problem, Fix and Effort, and sit in their own group and are never part of a recommended batch.
- No evidence, no finding. Calibrate with "Not a finding"; an empty list for a package is a valid result.

### 5. Backlog
Save to `findingsFile`, newest assessment first:

```
# Findings · <repo key>
Assessed: <date> at <short sha> · Scope: <packages> · Depth: <N>
```

followed by the findings. If the file already exists, merge: keep IDs and statuses of findings that still apply, mark ones whose problem is gone as `done (gone at <sha>)`, append new ones with the next free ID. Never renumber. Then run `backlog check`; if it lists problems, fix the file and run it again until it prints OK.

### 6. Report and pick
Your reply is, in this order:
1. The output of `backlog roadmap`, verbatim: it gives "Start here", the batches in dependency order with severity, effort, blast, tests and what each waits for, and the minor group last. Add one line per finding (ID, one-line problem, files) under it.
2. A "Guardrails" line if tests, linting or boundary tools are missing.
3. Two verdicts, each one line with a reason: `Structure: sound | needs work — <why>` and `Code design: sound | needs work — <why>`. Structure is folders, layers, imports and cycles; code design is the D-rules inside the files you read. They can differ, and a clean verdict is allowed when nothing was found.
4. Scope note: how many files were read out of how many, so the user knows what is not covered.

Then AskUserQuestion (multiSelect) with up to 4 batches taken from the roadmap in order, skipping batches that wait for one not yet chosen unless both are offered. Label: the batch name. Description: its IDs, effort and blast. The user can type other IDs under "Other". Then go to `plan` with the chosen IDs.

When AskUserQuestion is not available or not answered, end with the list and: "Pick with /craft:architect plan <IDs>".

## plan <IDs>
1. Read the chosen findings from the backlog and re-check their evidence against the current code.
2. If they change module or folder structure, choose the target first (section Targets) and include it.
3. Present the plan in the craft:plan shape, covering only the chosen IDs. Wait for approval.
4. Migrate following craft:refactor: characterization tests first, one batch per commit or a few small commits per batch, verify after each.
5. After each batch is committed, set its findings to `done (<short sha>)` in the backlog. If the work reveals a new problem, add it as a new finding instead of widening the batch.
6. If a target architecture was introduced or extended, update the `## Architecture` section in the conventions file and run `node "${CLAUDE_PLUGIN_ROOT}/hooks/repo.mjs" mark`.

## status
Run `backlog roadmap`. Show counts per status and severity, the roadmap it prints, and the date and commit of the last assessment. Suggest re-assessing if that commit is far behind HEAD.

## next
Run `backlog roadmap` and recommend up to 4 batches in its order and ask with AskUserQuestion (multiSelect). Then `plan` the chosen ones.

## Targets
Size first:
- **Small** (one team, a handful of features): plain feature folders. No layers beyond that.
- **Medium and up**: the defaults below.

Defaults (rules in [reference.md](reference.md)):
- **Frontend web and React Native**: Feature-Sliced Design v2.1.
- **Backend**: feature modules with a public entry each; ports and adapters only around real external I/O you need to swap or fake.
- **Android / Kotlin**: a module or package per feature with `ui` and `data`; `domain` only for logic shared across screens.
- **Monorepo**: apps never import apps; packages never import apps; apps use packages only through their public entry.
- **Existing repo with a working architecture**: keep it and fix the findings. Do not migrate to a default because it is the default.

Record the target in the `## Architecture` section of the conventions file: style, folder map, dependency rules, enforcement command, migration status per area.

Write a decision record only for a choice that is expensive to reverse or affects other teams (splitting a service, changing the database, a public API contract): one page in `docs/adr/NNNN-title.md` with Context, Decision, Consequences. Ask first.

## enforce
Set up the boundary tool for the stack; commands and config are in [reference.md](reference.md), dependency-cruiser templates in `${CLAUDE_PLUGIN_ROOT}/templates/`.

| Stack | Tool |
|---|---|
| TS / JS | dependency-cruiser, with a known-violations baseline |
| Kotlin | Konsist tests |
| Java | ArchUnit tests |
| Python | import-linter |
| Go | `internal/` packages and depguard in golangci-lint |
| Rust | crate boundaries in a workspace, `pub(crate)` by default |

Record existing violations as a baseline so only new ones fail, and shrink it as batches land. Add a `lint:arch` script or keep the config at the root so the craft verify hook runs the check. Confirm with `echo '{}' | CRAFT_VERIFY=plan node "${CLAUDE_PLUGIN_ROOT}/hooks/verify.mjs"`.

Design rules (D1–D10) are not enforceable by import tools; the reviewer agent checks them on every review.
