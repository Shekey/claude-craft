---
name: bug
description: The bug path of craft:task. Use when something is wrong (wrong output, crash, error, regression, failing test): reproduce it, write a failing test, find the root cause, fix it, then look for the same bug elsewhere.
---

# Fix a bug

Do the steps in order. Do not edit source code before step 2 has a failing test, unless step 2 says why there can't be one.

1. **Reproduce.** Get the exact input or steps and see the failure yourself: run the test, the command or a short script. Write down what happens and what should happen. If you cannot reproduce it, stop and say what you tried and what you need; do not fix by guessing.
2. **Failing test.** Write a test in the repo's runner, location and style that fails for the reported reason, at the lowest level that shows the bug (a unit test of the function beats an end-to-end test). Run it and confirm it fails with the expected message, not a typo or import error. If the code cannot be tested as it is, take the smallest seam from `craft:tests` step 1, or keep the reproduction script and say what blocks a test.
3. **Root cause.** Trace the real flow from the input to the wrong result. Name the cause in one sentence that explains why, not only where ("the cart total is NaN because `sum` starts from `undefined` when the list is empty"). Check every caller of the code you plan to change.
4. **Fix.** Change the cause, not the symptom: no special case for the reported input, no try/catch that hides the error. Keep the fix minimal. The new test and the related tests pass.
5. **Same bug elsewhere.** Search for the pattern that caused it: the same call, idiom, copied block or wrong assumption (`git grep`, Grep). In the same flow and clearly the same defect: fix it with a test in the same commit. Elsewhere: list it with `path:line` and add it to the backlog; don't widen the fix.
6. **Tail.** Apply the shared tail from `craft:task` (while here, verify, review, commit). The test and the fix go in one commit, so every commit passes.

Report in this shape:

```
Cause: one sentence
Fix: what changed, path:line
Test: the test that failed before and passes now
Same pattern: fixed here / found at path:line (backlog A7) / none found
```
