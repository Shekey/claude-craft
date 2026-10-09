---
type: llm
---

PASS if the response points out that the add-expense screen keeps the expense fields (title, amount, currency, category, date, note) as many separate state variables that are set in several places (initial values, loading an expense for editing, applying a scanned receipt), and recommends one draft or form model object, with mappers or constructors, instead.
FAIL if it does not identify this, or only mentions the number of useState calls without recommending a single model.
