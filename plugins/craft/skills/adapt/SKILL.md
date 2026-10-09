---
name: adapt
description: Use when working in a repo that already has code and conventions. Discovers and records the repo's architecture so new code fits in instead of following generic defaults.
---

# Adapt to the existing repo

Where things live: the craft repo context at the top of the session names this repo's conventions file and settings file. By default both sit in craft's local cache (`~/.claude/craft/repos/<repo-key>/`), outside the repo, so nothing is added to the codebase. If the repo itself has `.claude/conventions.md` or `.claude/craft.json`, those are the team's shared copies and win. To see the paths again: `node "${CLAUDE_PLUGIN_ROOT}/hooks/repo.mjs" paths`.

If the conventions file exists, read it and trust it. Re-check only the parts the task touches, update them if the code has moved on, then run `node "${CLAUDE_PLUGIN_ROOT}/hooks/repo.mjs" mark`.

Otherwise discover, then write the conventions file (max ~50 lines, facts only):

- **Stack and tooling**: the stacks from `node "${CLAUDE_PLUGIN_ROOT}/hooks/repo.mjs" stack` and where each lives, language versions, package manager (from the lockfile), formatter, linter, type checker, test runner, the scripts or tasks that run them.
- **Architecture**: the style in use (feature folders, FSD, layered, modules, hexagonal, none), the folder map, the direction of dependencies, where business logic lives versus UI or I/O, any boundary tool already configured. If it hurts, note the pain in one line; propose `craft:architect` in a plan only when the user's task needs it.
- **Patterns**: state management, data fetching, DI style, error handling, validation, logging.
- **Naming**: files, components, functions, tests, branches.
- **Tests**: location, naming, fixtures and mocks style, what is usually tested.
- **Commits**: the style of the last ~20 commits (`git log --oneline -20`).
- **Verify**: the exact commands that prove a change is correct.

Then check what the craft verify hook would run, from the repo root with any uncommitted change present:

```bash
echo '{}' | CRAFT_VERIFY=plan node "${CLAUDE_PLUGIN_ROOT}/hooks/verify.mjs"
```

Write the settings file with only the keys that apply. If the detected commands match how this repo is really checked (CI config, scripts, README):

```json
{ "lean": "full", "tests": "related" }
```

If they do not match, pin the real commands. `fix` runs first and its failures are ignored; `verify` must pass:

```json
{
  "fix": ["pnpm biome check --write ."],
  "verify": ["pnpm lint", "pnpm typecheck", "pnpm vitest related --run --passWithNoTests"],
  "tests": "related"
}
```

Options: `lean` (lite, full, ultra, off), `tests` (`related` or `full`), `improve` (`fix`, `record`, `off`), `fix`, `verify` (array of commands, or `false` to disable the check for this repo).

Improve mode: ask once whether this is the user's own repo or someone else's (a client or agency project), with AskUserQuestion when available. For someone else's repo set `"improve": "record"`, so craft records improvements in the backlog instead of changing code the task didn't ask for. For the user's own repo leave it out (`fix` is the default). When nobody can answer, leave it out and say so in one line.

Stack pack: if `repo.mjs stack` names a pack for the stack you are adapting to, read it. Where the repo's own tools, layout or patterns differ from the pack, write the repo's choice in the conventions; it wins. Never add the pack's suggested tools to an existing repo unasked.

Finally run `node "${CLAUDE_PLUGIN_ROOT}/hooks/repo.mjs" mark` to record the commit the conventions describe.

Only create `.claude/` files inside the repo when the user wants to share them with the team.

Rules while implementing:
- Mirror the closest existing example, even where you would design it differently.
- When conventions are inconsistent, follow the newest code in the area you are touching.
- Raise disagreements with the architecture in the plan; do not act on them unasked.
