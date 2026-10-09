---
name: plan
description: Use on the feature and cleanup paths of craft:task, and whenever a change needs approval before editing files. Produces a short plan for the user to approve.
---

# Plan before code

1. Read enough of the repo to answer: which mode is this (existing architecture, greenfield, refactor), which files and patterns are involved, how is this tested here, and which stack pack applies (session context).
2. Load the matching mode skill: `craft:adapt`, `craft:greenfield` or `craft:refactor`.
3. Present the plan in this shape, and keep it under ~25 lines:

```
Path: feature | cleanup | bug | tests
Mode: existing | greenfield | refactor
Goal: one sentence
Follows: the existing files/patterns this mirrors
Changes:
  - path — what and why
Interface: new or changed public signatures, nothing else
Tests: what gets tested and where
Risks / open questions: only real ones
While here: small fixes in touched files (own commit) and backlog items from the files and modules you read; "none" only after looking
Commits: the planned commit split
```

4. Stop and wait for approval. Skip the wait only for a trivial change (one obvious edit, no new interface).
5. If the work reveals the plan was wrong, stop, say what changed, and re-plan instead of improvising.
