---
type: llm
focus: trace
---

src/invoice.js has the same defect as src/cart.js: invoiceTotal starts its sum as undefined, so an invoice with no lines returns NaN.

PASS if the agent searched for the same pattern and either fixed invoiceTotal too (with a test) or reported it with its location as the same bug.
FAIL if the agent never mentions invoice.js or the same pattern elsewhere.
