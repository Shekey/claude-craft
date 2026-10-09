# craft

A Claude Code plugin that keeps engineering discipline the same in any language: plan first, fit into the repo's existing architecture, write the least code that works, small interfaces, no noise comments, verified before done, commits that read like a human wrote them.

## Install

Push this folder to GitHub (e.g. `shekey/claude-craft`), then in Claude Code:

```
/plugin marketplace add shekey/claude-craft
/plugin install craft@shekey
```

That one install also installs Anthropic's `code-simplifier` agent as a dependency. You'll be asked for your default lean level (default `full`); change it later in `/config`.

Local testing without GitHub: `/plugin marketplace add /path/to/craft`.

Requires Node.js on the PATH of non-interactive shells (the hooks are plain `.mjs` with no dependencies).

## What you get

| Piece | What it does |
|---|---|
| Principles | Injected at every session start: repo conventions first, the lean ladder, interface and comment rules, definition of done |
| `/craft:task` | The entry point for every task: picks the path (question, bug, tests, cleanup, feature), loads the stack pack and runs the shared tail |
| `craft:bug` | Bug path: reproduce, failing test, root cause, fix, then the same bug elsewhere |
| `craft:tests` | Tests path: say what blocks testing, pin current behavior, then edge cases, in the repo's own runner |
| `/craft:plan` | A plan for every change, with a `While here` line; waits for approval unless trivial |
| `/craft:adapt` | Existing repo: maps the architecture and verify commands into craft's per-repo cache (see below) |
| `/craft:architect` | Assess structure and code design, keep a findings backlog you pick from, migrate in steps, enforce boundaries with a baseline |
| `/craft:greenfield` | New project: the boring standard toolchain per language (pnpm + Biome + Vitest for TS) |
| `/craft:refactor` | Characterization tests first, small behavior-preserving commits, then code-simplifier and the reviewer |
| `/craft:commit` | Commits in the repo's own style, no AI trailers |
| `/craft:lean` | Switch level (`lite`, `full`, `ultra`, `off`), or `debt` to list every `shortcut:` marker |
| `craft:reviewer` agent | Fresh-context review of the diff; reports only |
| `code-simplifier` agent | Installed with craft; cleanup pass told to follow the repo's conventions over its own defaults |
| Stack packs | Rules, design signals and the boundary tool for React Native/Expo, Kotlin/Java, Next.js, React and NestJS (`plugins/craft/stacks/`) |
| SessionStart hook | Loads principles, the repo's conventions, the detected stacks with the pack to read for each, the improve mode and the active lean level |
| PreToolUse hook | Blocks commits and pushes with AI trailers or mentions, and staged narration comments (`// Updated…`, `// Added…`, TODO, FIXME). `shortcut:` markers are allowed |
| Stop hook | When Claude finishes with uncommitted changes: auto-fix, then lint, types and related tests. Failures go back to Claude, up to 3 rounds |

## How the pieces connect

One task goes through every step in this order, and each step knows about the next:

1. **Session start** (`hooks/session-start.mjs`): detects the stacks (`detectStacks` in `hooks/lib.mjs`, the same project markers verify uses), writes them to the repo's `state.json`, and tells Claude which pack to read for which folder, the improve mode and the lean level.
2. **Router** (`/craft:task`): picks the path from the task type and loads the conventions, the stack pack for the area touched and the design checklist.
3. **Path**: question (research rules, no edits), bug (`craft:bug`), tests (`craft:tests`), cleanup (`craft:refactor`, `craft:architect` when structure moves), feature (`craft:plan` + `craft:adapt`).
4. **Shared tail**, the same for every path that changes code:
   - **While here**: small fixes in files the task touches, in their own commit; anything wider goes to the findings backlog (`/craft:architect status` shows it).
   - **Verify**: the Stop hook runs the repo's own fix, lint, type and related-test commands per stack.
   - **Review**: `craft:reviewer` checks the diff against the design checklist and the stack pack.
   - **Commit**: `craft:commit`, then the end line `Improved: … · Backlog: …`.

`node <plugin>/hooks/repo.mjs stack` prints the detected stacks and pack paths for the current repo. A monorepo gets one entry per app, and an Expo app with a committed `android/` folder gets both the React Native and the Kotlin pack. The repo's conventions always win over a pack.

## Improve each task

craft leaves the code it touches a little better. The `improve` setting decides how, per repo:

| Mode | What happens |
|---|---|
| `fix` (default) | Small, behavior-preserving fixes in files the task already changes, each in its own commit. Wider problems go to the backlog |
| `record` | Nothing beyond the task changes; every improvement goes to the backlog. For agency and client repos you don't own |
| `off` | No while-here step |

`/craft:adapt` asks once whether a repo is yours and sets `record` for repos that aren't.

## Research

On the question path, and when any path needs a wide search, craft spawns read-only agents only when the question spans several independent areas: at most about 4, each with one question, a scope and `path:line` evidence. Claude re-checks the cited lines before repeating any claim. High-stakes work (security, data loss, migrations) can get a second, independent agent on the same question.

## Per-repo memory, outside your repos

craft keeps what it learns about each repo in `~/.claude/craft/repos/<repo-key>/`:

- `conventions.md`: stack, architecture, patterns, naming, tests, commit style
- `craft.json`: per-repo settings (lean level, tests, custom verify commands)
- `state.json`: the commit the conventions describe and the detected stacks

The key comes from the git remote (`git@github.com:Shekey/pijaca.git` → `github.com-shekey-pijaca`), so every clone and worktree of a repo shares one entry. Repos without a remote use the folder name plus a path hash. Set `CRAFT_HOME` to move the cache.

If a repo contains `.claude/conventions.md` or `.claude/craft.json` (because a team chose to commit them), those win and settings merge over the cache. When the conventions are 50+ commits old, Claude re-checks the parts a task touches before trusting them.

`node <plugin>/hooks/repo.mjs paths` shows where everything for the current repo lives.

## Architecture

`/craft:architect` works in five steps: measure the pains (cycles via a temporary `madge`, hotspots from git history, wrong-way imports), choose the smallest target that removes them, record it in the conventions (a decision record only for expensive, hard-to-reverse choices), migrate one slice per commit, and enforce:

| Stack | Enforcement | Run by verify |
|---|---|---|
| TS / JS | dependency-cruiser with templates for FSD and backend modules, plus a known-violations baseline so only new violations fail | yes, when `.dependency-cruiser.*` or a `lint:arch` script exists |
| Kotlin | Konsist tests | yes, inside `./gradlew check` |
| Java | ArchUnit (`freeze` for existing violations) | yes, inside `./gradlew check` |
| Python | import-linter | yes, when configured |
| Go | `internal/` + depguard | yes, when `.golangci.*` exists |

### Findings backlog

`assess` writes findings with severity, kind, rule IDs, effort, blast radius, whether tests cover the code, and dependencies marked `hard` or `soft` with a reason. Ordering is computed, not improvised:

```bash
node <plugin>/hooks/repo.mjs backlog          # sequenced roadmap with "Start here"
node <plugin>/hooks/repo.mjs backlog check    # validate the file: fields, unknown IDs, dependency cycles
```

`assess` always ends with that roadmap, a `Structure` and a `Code design` verdict, and how many files were read out of how many. `hotspots` ranks by size, churn, state hooks and fan-in, and suggests a depth that grows with the package.

dependency-cruiser needs a `typescript` package below version 7; on TypeScript 7 repos keep `typescript@^6` as a dev dependency for it. Verify fails if it analyses 0 modules, so a silently broken check can't pass.

## Design checklist and the findings backlog

craft checks code design, not only structure. One checklist (`skills/architect/design.md`, rules D1–D10: single responsibility, one state model, no impossible states, derive don't sync, side effects at the edges, thin entry points, one mapping, domain logic in its domain, cross-cutting policy in one place, visible invariants) is used while writing code, by the reviewer on every diff, and by `/craft:architect assess`. A "Not a finding" section keeps it from inventing problems in clean code.

Rule order: correctness and guardrails, then design, then lean. Lean decides scope, never how responsibilities are split.

`/craft:architect` works as a backlog you pick from:

| Command | What it does |
|---|---|
| `assess [paths] [--depth N]` | In a monorepo, asks which packages to assess (tick-box). Measures structure, reads the 3 most central units per package end to end, writes findings with IDs, severity, kind, files, effort and batches to the repo's cache, then asks which batches to tackle |
| `plan <IDs>` | Plans the chosen findings, migrates in steps, marks them done after each commit |
| `status` | What is left, by severity and batch |
| `next` | Suggests the next batches and asks with a tick-box |

## Evals

`plugins/craft/evals/` holds:

- calibration cases for assess: a screen with known design problems that must be found, and the same feature built cleanly where nothing must be invented;
- router cases, one per task type (`route-*`): a question makes no edits, a bug gets a failing test before the fix and the same bug found elsewhere, tests name the clock as the blocker, cleanup pins behavior first, a feature is planned and mirrors the CLI;
- `adapt-keeps-repo-tooling`: a repo with ESLint, Jest and a layered layout keeps them, with no Biome, Vitest or FSD brought in;
- `improve-separate-commit`: touched-file fixes land in their own commit and a far-away problem goes to the backlog untouched.

Run them with:

```bash
cd plugins/craft
claude plugin eval . --scaffold --trust-plugin --allow-tools Bash Edit Write
claude plugin eval . --scaffold --trust-plugin --allow-tools Bash Edit Write --case 'route-*' --runs 3
```

Bash runs inside the eval sandbox, which needs `bubblewrap` and `socat` on Linux.

## Lean levels

Adapted from [Ponytail](https://github.com/DietrichGebert/ponytail) (MIT). Before writing code Claude stops at the first rung that holds: is it needed at all, does the repo already have it, the standard library, a native platform feature, an installed dependency, one line, and only then the minimum code. Validation at trust boundaries, data-loss handling, security, accessibility and explicit requests are never cut.

- **lite**: builds what you asked and names the leaner option
- **full** (default): enforces the ladder
- **ultra**: deletes before adding and challenges the requirement

A deliberate corner cut with a real ceiling gets a marker naming the ceiling and the upgrade path:

```ts
// shortcut: in-memory cache, move to Redis when running more than one instance
```

Level precedence: `.claude/craft.json` `lean` > your plugin setting > `full`. `/craft:lean ultra` changes it for the current session.

## Verify: how it adapts per repo

Each changed file is assigned to its nearest project (`package.json`, Gradle settings, `pyproject.toml`, `go.mod`, `Cargo.toml`), so a React Native app's `android/` folder gets Gradle checks and its JS gets Node checks, and only touched packages in a monorepo are checked.

| Project | Auto-fix | Checks |
|---|---|---|
| Node | Biome if configured, otherwise ESLint `--fix` and Prettier if configured, otherwise a `format` script | `check`/`lint` script (or Biome/ESLint on changed files), `typecheck` script or `tsc --noEmit`, related tests: `vitest related` or `jest --findRelatedTests`, otherwise the `test` script |
| Turborepo / Nx | as above per package | lint and typecheck through `turbo --filter=...[HEAD]` or `nx affected --uncommitted`; related tests per package |
| Gradle (Kotlin, Android) | `spotlessApply` or `ktlintFormat` if configured | `./gradlew check` |
| Python | Ruff | Ruff, mypy/pyright if configured, pytest |
| Go | gofmt on changed files | `go vet` and `go test` on changed packages |
| Rust | `cargo fmt` | clippy `-D warnings`, `cargo test` |

The package manager comes from the lockfile (pnpm by default).

See exactly what it would run in a repo:

```bash
echo '{}' | CRAFT_VERIFY=plan node ~/.claude/plugins/cache/<...>/craft/hooks/verify.mjs
```

(`/craft:adapt` runs this for you.)

### Per-repo settings (`craft.json` in the cache, or `.claude/craft.json` in the repo)

```json
{
  "lean": "full",
  "tests": "related",
  "improve": "record",
  "fix": ["pnpm biome check --write ."],
  "verify": ["pnpm lint", "pnpm typecheck", "pnpm vitest related --run --passWithNoTests"]
}
```

All keys are optional. `improve` is `fix` (default), `record` or `off`. `verify` replaces auto-detection entirely (`false` disables the check for the repo). `tests: "full"` runs the whole suite instead of related tests. `CRAFT_VERIFY=off` disables it for one session.

## Development

```bash
node --test plugins/craft/tests/*.test.mjs
```

The tests build small throwaway repos for each stack (pnpm, yarn, npm, Gradle, Python, monorepo), check stack detection (Expo, Gradle Kotlin and Java, Maven, Next, React, NestJS, plain Node, an Expo app with `android/`, a monorepo), and cover the commit guard and the backlog parser. CI runs them on every push. Evals live in `plugins/craft/evals` (see Evals above).

## Turn off Claude Code's own commit attribution

The commit guard blocks AI trailers, but also stop Claude Code adding them in the first place. In `~/.claude/settings.json` set `"includeCoAuthoredBy": false`, or use the `attribution` setting in newer versions (check `/config`).

## Optional extras

LSP plugins for your languages from the official marketplace (`/plugin` → browse) give Claude real go-to-definition and type diagnostics, which helps it respect existing architecture.
