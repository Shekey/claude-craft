# Craft principles

## Priority
1. The repo's existing conventions: architecture, folder layout, naming, patterns, lint and format config, commit style.
2. The project's CLAUDE.md and the repo's craft conventions file (path in the craft repo context below).
3. These defaults.
Never "improve" a repo's established pattern unless the task is a refactor that asks for it.

## Every task
- Start with a plan (craft:plan skill). Wait for approval unless the change is trivial (one obvious edit).
- Identify the mode: existing architecture (craft:adapt), new project (craft:greenfield), refactor (craft:refactor) or structural change (craft:architect).
- Before writing code, find 2–3 existing files that do something similar and mirror them.

## Lean ladder (adapted from Ponytail, MIT)
Understand the problem and trace the real flow first. For a bug, find the root cause and check every caller of what you change. Then stop at the first rung that holds:
1. Does this need to exist at all? If the need is speculative, skip it and say so in one line.
2. Does the repo already have it? Reuse its helpers, types and patterns.
3. Does the standard library do it?
4. Does the platform do it natively (HTML input types, CSS instead of JS, DB constraints, Android/iOS APIs)?
5. Does an already-installed dependency solve it?
6. Can it be one line?
7. Only then write the minimum code that works.
Never simplify away: input validation at trust boundaries, error handling that prevents data loss, security, accessibility basics, or anything the user explicitly asked for.
The active level (lite, full, ultra) is stated at the end of this context; `craft:lean` explains the levels.

## Code
- Smallest public interface that solves the problem. No speculative abstractions, options or extension points.
- Small functions, intention-revealing names, early returns, no flag parameters, no dead code.
- Composition over inheritance. Introduce an interface only at a real boundary (I/O, external service, a second implementation that exists today).
- Handle errors at the layer that can act on them. Never swallow errors silently.
- Follow the language's idioms rather than porting patterns from another language.
- No new dependency without stating why in the plan.

## Comments
- Do not write comments that restate the code or narrate changes ("added", "updated", "now uses", "fixed", "changed from").
- Do not leave TODOs, FIXMEs or commented-out code.
- Allowed only:
  - a short why-comment for a non-obvious decision or workaround;
  - public API docs where the ecosystem expects them (KDoc, JSDoc on published libraries, docstrings, godoc) and the repo already uses them;
  - a `shortcut:` marker on a deliberate simplification with a real ceiling, naming the ceiling and the upgrade path, e.g. `// shortcut: linear scan, index by id past ~1k items`. Only when a corner is actually cut, never as decoration.
- Never mention AI, Claude or assistance in code, comments, commits or PRs.

## Done means
- Formatter, linter, type checker and tests pass (the verify hook runs them; fix every failure it reports).
- New behavior has tests in the repo's test style.
- The diff contains only what the task needs.
- Commits follow craft:commit.
