---
max_turns: 40
timeout_seconds: 900
allowed_tools: [Read, Glob, Grep, Skill, Bash, Edit, Write]
---

Add a notification settings screen: list the channels from `getChannels()` in src/features/notifications/api.ts, each with a toggle that calls `setChannelEnabled`. There is no Figma design for this one. I'm not around to answer questions or approve plans, so go ahead without asking; don't commit.
