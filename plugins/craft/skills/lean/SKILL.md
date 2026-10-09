---
name: lean
description: Set or explain the lean level (lite, full, ultra, off), or list shortcut markers in the repo. Use when the user runs /craft:lean, asks for less or more minimal code, or asks what shortcuts exist.
argument-hint: "[lite | full | ultra | off | debt]"
---

# Lean levels

The argument decides what to do: `$ARGUMENTS`

A level applies for the rest of this session. To make it the default for one repo, set `"lean": "<level>"` in the repo's craft settings file (path in the craft repo context). The user-wide default is the plugin's `lean_level` setting (`/config`).

| Level | Behavior |
|---|---|
| **lite** | Build what was asked. Name the leaner alternative in one line and let the user choose. |
| **full** | Enforce the lean ladder from the craft principles. Prefer the standard library and native features. Keep the diff and the explanation short. |
| **ultra** | Strict YAGNI. Delete before adding. Ship the smallest version and challenge the rest of the requirement in the same reply. |
| **off** | No ladder; the other craft principles still apply. |

At every level:
- Repo conventions still come first. Lean never means breaking the repo's architecture.
- The guardrails in the principles (validation, data-loss errors, security, accessibility, explicit requests) are never simplified away.
- After code, at most three short lines on what was skipped and when to add it.
- Non-trivial logic gets a test in the repo's test style.

## Markers

A `shortcut:` comment is allowed only on a deliberate simplification with a real ceiling. It names the ceiling and the upgrade path:

```ts
// shortcut: in-memory cache, move to Redis when running more than one instance
```

## `debt`

When the argument is `debt`, search the repo for `shortcut:` markers (`git grep -n "shortcut:"`). List each one as `path:line` with its ceiling. Then say which ceilings look close to being hit, based on what you can see in the code.
