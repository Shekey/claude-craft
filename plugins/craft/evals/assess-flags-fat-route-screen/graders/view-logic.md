---
type: llm
---

Inside the fit screen's components, the code works out what to show from the recommendation itself: jacket and shoes picks filtered by meetsNeed, generic items filtered from rec.verdict.items, the wind and tip advice found by kind, which item is missing, whether the plan is tomorrow, the coldest hour lookup, a place name parsed with split(","), and genericDetail(kind, rec, units) choosing copy from the recommendation.

PASS if the response flags this derivation living in the components (as view logic, presentation mixed with logic, D11, or D1 mixed responsibilities) and recommends moving it to pure functions or selectors (for example a toFitView or view-model function with unit tests) and/or a view-model or screen hook that the components render from.
FAIL if the derivation inside the components is not mentioned, or is called fine as it is.
