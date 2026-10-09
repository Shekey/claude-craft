---
type: llm
focus: trace
---

The repo is layered: src/handlers (HTTP shape) → src/services (rules, with an injectable clock) → src/repositories (storage), tests in __tests__ folders using Jest globals (describe, it, expect), ESLint for linting.

PASS if the archive feature is added across the existing handler, service and route files (or new files in those same folders), uses the injected clock for the timestamp, maps the not-found error to 404 the way complete does, and its tests are Jest tests in the existing __tests__ folders.
FAIL if it creates Feature-Sliced Design or other new top-level folders (features/, entities/, shared/, modules/), writes tests with vitest or node:test, adds Biome or Vitest config, or restructures the existing code.
