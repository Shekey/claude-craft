---
name: commit
description: Use whenever creating git commits or pull request descriptions. Writes commits the way an experienced engineer on this repo would.
---

# Commit like a human

0. Before the first commit of a task that changed code, run the while-here pass from `craft:task` if it has not run yet: re-read the changed files and the modules they call, commit small fixes separately, add wider problems to the backlog.
1. Run `git log --oneline -20` and match the repo's style: Conventional Commits only if the repo uses them, ticket prefixes if it uses them, same casing and tense.
2. Split into logical commits: tooling, tests, refactor and behavior each separate. Stage with explicit paths, never `git add -A` blindly.
3. Subject: imperative, at most ~60 characters, says what changes for the codebase ("Add retry to order sync"), no trailing period.
4. Body only when the why is not obvious: one to three short lines about the reason or the trade-off. No bullet list of every file touched.
5. Never include: `Co-Authored-By` lines for AI, "Generated with", emojis, the words Claude, AI or assistant, links to sessions.
6. PR descriptions: what and why in a few sentences, how it was tested, anything the reviewer must look at. No AI footer.
7. Do not push unless the user asked for it.
