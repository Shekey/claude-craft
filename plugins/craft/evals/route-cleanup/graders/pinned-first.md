---
type: llm
focus: trace
---

src/report.js has no tests in the fixture.

PASS if the agent wrote tests for salesReport and ran them passing against the original code before changing src/report.js, then ran them again after the change and they still passed.
FAIL if src/report.js was edited before any test for salesReport existed and passed.
