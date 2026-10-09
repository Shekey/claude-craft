---
name: architect
description: Use when the user wants to improve, restructure or set up a codebase's architecture, when a refactor changes module or folder structure, or when starting a project large enough to need one. Assesses with evidence, picks the smallest fitting target, migrates in safe steps and enforces boundaries.
argument-hint: "[assess | plan | enforce] [path]"
---

# Architecture

Work through these phases in order. `$ARGUMENTS` may ask for only one of them. Present phases 1–2 as the plan and wait for approval before changing code.

## 1. Assess with evidence

Measure before judging. Use temporary tools via `npx -y` / `uvx`; do not add dependencies for this.

- **Cycles**: TS/JS `npx -y madge --circular --extensions ts,tsx,js,jsx <src>`; Python `uvx pydeps --show-cycles --no-output <pkg>`; Go and Rust compilers already forbid package cycles.
- **Hotspots**: the largest files and the most-changed files (`git log --since=6.months --name-only --format= | sort | uniq -c | sort -rn | head -20`). Large and frequently changed together is where structure hurts.
- **Wrong-way dependencies**: UI importing data access directly, shared code importing features, domain code importing framework or database code.
- **Duplication**: the same concept implemented in several places.

Report the top 3–5 pains, each with file references and the cost it causes (bugs, slow changes, merge conflicts, untestable code). If nothing hurts, say so and stop. Architecture work needs a reason.

## 2. Choose the smallest target that removes those pains

Size first:
- **Small** (one team, a handful of features): plain feature folders. No layers beyond that.
- **Medium and up**: the defaults below.

Defaults by kind (details and rules in [reference.md](reference.md)):
- **Frontend web and React Native**: Feature-Sliced Design v2.1.
- **Backend**: feature modules (vertical slices) with a public entry per module. Add ports and adapters only around real external I/O (database, queues, third-party APIs) where you need to swap or fake them.
- **Android / Kotlin**: one module or package per feature with `ui` and `data`; add `domain` only for logic shared across screens.
- **Existing repo with a working architecture**: keep it and fix only the pains. Do not migrate to a default just because it is the default.

State the target in the plan: the folder map, the dependency rules in one line each, and what moves first.

## 3. Record the decision

Write an `## Architecture` section in the conventions file (path from the craft repo context): target style, folder map, dependency rules, enforcement tool and command, migration status (done / in progress / not started per area). Run `node "${CLAUDE_PLUGIN_ROOT}/hooks/repo.mjs" mark` after.

Write a decision record only for a choice that is expensive to reverse or affects other teams (splitting a service, changing the database, a public API contract): one page in `docs/adr/NNNN-title.md` with Context, Decision, Consequences. Ask first. Everything else stays in the conventions file.

## 4. Migrate in safe steps

- Characterization tests around the area before moving it (see `craft:refactor`).
- Move one slice or module per commit. The app builds and tests pass after every commit.
- Move files first, change behavior never. Use the language tooling (IDE refactors, `ts-morph`, codemods) to update imports rather than hand edits across many files.
- New code follows the target immediately; old code moves when touched or in planned steps.

## 5. Enforce the boundaries

Set up the tool for the stack. Commands and config examples are in [reference.md](reference.md); dependency-cruiser templates are in `${CLAUDE_PLUGIN_ROOT}/templates/`.

| Stack | Tool |
|---|---|
| TS / JS | dependency-cruiser, with a known-violations baseline |
| Kotlin | Konsist tests |
| Java | ArchUnit tests |
| Python | import-linter |
| Go | `internal/` packages and depguard in golangci-lint |
| Rust | crate boundaries in a workspace, `pub(crate)` by default |

Record existing violations as a baseline so only new violations fail, and shrink the baseline as migration proceeds. Add a package script (`lint:arch`) or keep the config at the root so the craft verify hook runs the check automatically. Confirm by running verify in plan mode: `echo '{}' | CRAFT_VERIFY=plan node "${CLAUDE_PLUGIN_ROOT}/hooks/verify.mjs"`.
