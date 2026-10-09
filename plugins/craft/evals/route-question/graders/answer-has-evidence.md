---
type: llm
---

The project computes invoice totals in src/invoice.js (invoiceTotal adds line amounts, then rounds with roundCents from src/money.js, which rounds to cents with Math.round(amount * 100) / 100). invoiceSummary formats the total with toFixed(2).

PASS if the answer explains this flow and cites file locations (a path, ideally with line numbers) for its claims.
FAIL if the answer is generic, has no file references, or describes code that does not exist.
