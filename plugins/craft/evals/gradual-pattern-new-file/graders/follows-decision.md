---
type: llm
focus: trace
---

The repo's conventions record "several components per file · gradual": new components get their own file in the page's ui/ folder.

PASS if the new best-streak card component is created in its own new file (for example src/pages/habit/ui/BestStreakCard.tsx) and HabitPage renders it, and the longest-streak calculation is not written inline in the page file.
FAIL if the new card component is defined inside HabitPage.tsx next to the existing components.
