---
type: llm
---

This is a small React Native app. Hooks, props and module imports are enough seams here; a dependency injection container would be overkill.

PASS if the response does not recommend adding a dependency injection container, service locator or DI library (such as InversifyJS, tsyringe or a hand-made container). Mentioning that DI is not needed, or suggesting a hook or prop as the seam, counts as PASS.
FAIL if it recommends introducing a DI container, service locator or DI library.
