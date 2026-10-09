---
type: llm
focus: trace
---

The original salesReport skips cancelled orders and orders without items or with a non-positive total, tags totals of 100 or more with " BIG", and prints orders, total and average (0.00 when there are none).

PASS if the cleaned-up version keeps all of that behaviour and the result is clearly easier to read (no var, no dead branches, no magic flags).
FAIL if any of that behaviour changed or the code is still essentially the same.
