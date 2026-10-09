---
name: tests
description: The tests path of craft:task. Use when the task is to add, improve or extend tests, raise coverage, or make code testable: say what blocks testing, pin current behavior, then cover edge cases.
---

# Add tests

1. **Say what blocks testing.** Read the code under test and list what makes it hard to test: I/O inside logic, the clock, randomness, globals or singletons, framework coupling, a missing test setup for this area. Name each blocker in one line. Remove only the blockers you must, with the smallest behavior-preserving seam (pass the clock or client as a parameter with today's value as the default, extract a pure function), and commit that seam on its own before the tests. If a blocker needs a bigger change, say so and add it to the backlog.
2. **Pin behavior.** Write tests for what the code does today through its public interface: the main paths first. Use the repo's test runner, file location, naming, fixtures and mocking style; mirror the closest existing test file. Never bring in another runner or assertion library. If current behavior looks wrong, pin it in a test whose name says so and report it as a suspected bug; do not fix it on this path.
3. **Edge cases.** Then cover every branch boundary the code has: empty and single-item inputs, limits, invalid input at trust boundaries, error paths, time zones and dates when dates are involved, concurrency when there is shared state. Only cases the code actually distinguishes; no tests for impossible input.
4. **Keep them honest.** Each test checks one behavior and names it. Assert on results and visible effects, not on private calls. Mock only I/O and things the repo doesn't own. Tests are deterministic: fixed clock, seeded data, no real network. Run them and see each new test pass; to prove a test can fail, break the code briefly or check the assertion against a wrong value.
5. **Tail.** Apply the shared tail from `craft:task`. Tests are their own commit, separate from any seam or fix.

End with: what is now covered, what is still not, and why.
