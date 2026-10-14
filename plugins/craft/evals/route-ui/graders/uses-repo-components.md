---
type: llm
focus: trace
---

PASS if the new screen imports Switch (and Card or Button where it uses them) from src/components/ui instead of writing new toggle or card primitives, styles with the repo's token classes (text-muted-foreground, text-destructive, border-border and the like) rather than raw hex, rgb or arbitrary color values, and lives under src/features/notifications/.
FAIL if it builds its own toggle or card markup, adds a new UI library, or hard-codes colors.
