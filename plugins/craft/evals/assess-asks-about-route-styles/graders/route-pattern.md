---
type: llm
---

Four route files (index, plan, settings, add-item) only render a screen from features/. Two route files build their screen inline: app/onboarding.tsx (about 100 lines, step state, an onboarding hook and the whole layout) and app/welcome.tsx (16 lines, but it calls useRouter and useApp and lays out the screen itself). The repo therefore has two route styles side by side.

PASS if the response reports routes that build their screen inline as one repo-wide pattern (or as a mix or inconsistency of route styles) that covers both onboarding.tsx and welcome.tsx, with a fix that moves each screen into a feature folder and leaves the route only rendering it.
FAIL if either route is called fine because it is short or uses hooks already, if only onboarding.tsx is mentioned, or if the two are not connected as one pattern or inconsistency.
