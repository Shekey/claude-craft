---
max_turns: 50
timeout_seconds: 900
allowed_tools: [Read, Glob, Grep, Skill, Bash, Edit, Write]
---

Add an endpoint to archive a todo: POST /todos/:id/archive sets archived to true and records when, and 404s for an unknown id. Dependencies aren't installed in this checkout, so don't install anything or try to run the tools. I'm not around to answer questions or approve plans, so go ahead without asking; don't commit.
