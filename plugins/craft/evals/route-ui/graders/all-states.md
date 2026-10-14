---
type: llm
focus: trace
---

PASS if the screen handles a loading state, an error state with a way to retry, an empty state when there are no channels, and the populated list; and the toggles give feedback while saving or on failure (disabled while pending, or an error shown, or the change rolled back). Each toggle has an accessible name (a label tied to it, or aria-label).
FAIL if any of loading, error, empty or populated is missing, a toggle failure is silently ignored, or toggles have no accessible name.
