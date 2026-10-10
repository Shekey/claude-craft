---
type: llm
---

PASS if the response reports the flat lib/ folder (about 46 files mixing unrelated concerns such as auth, habits, notifications, settings, billing and profile) as a structure or layout problem, and recommends grouping those files by feature, entity or concept (for example feature folders, FSD slices, or sub-folders).
FAIL if lib/ is not flagged, or if the response calls the flat lib/ an acceptable repo convention.
