---
type: llm
focus: trace
---

PASS if the count command is added to the existing commands map in src/cli.js reusing itemCount from src/cart.js, a test is added in the repo's style (node:test with node:assert under test/), and no new dependency or test runner is introduced.
FAIL if itemCount is reimplemented, the CLI structure is rewritten, no test is added, or a new package (jest, vitest, a CLI library) is installed or configured.
