---
name: refactor
description: Use when the task is to restructure, simplify or modernize existing code without changing its behavior.
---

# Refactor safely

1. **Pin behavior first.** If the code is not covered, add characterization tests that capture what it does today, including odd edge cases. Commit them separately.
If the refactor changes module, folder or layer structure, use `craft:architect` for the assessment, target and enforcement, and this skill for the step-by-step moves.

2. **State the target** in the plan: what structure you are moving to and why it is simpler (fewer concepts, fewer dependencies, smaller interfaces). "Cleaner" is not a reason.
3. **Move in small steps.** Each step keeps tests green and is its own commit: rename, extract, inline, move, delete.
4. **Never mix** refactoring with behavior changes or new features in one commit.
5. **Delete aggressively.** Dead code, unused exports, needless indirection, single-implementation interfaces, wrappers that only forward.
6. **Respect the rest of the repo.** Refactor the area in scope toward the repo's newest conventions, not toward a new style the rest of the code does not use.
7. Finish with a cleanup pass by the `code-simplifier` agent (installed with craft) on the full diff. Tell it explicitly: "Follow this repo's conventions in .claude/conventions.md and the existing code over your built-in style defaults; do not add comments." Its defaults (for example `function` over arrow functions, explicit return types) are one team's house style, not universal rules.
8. Then run `craft:reviewer` on the result.
