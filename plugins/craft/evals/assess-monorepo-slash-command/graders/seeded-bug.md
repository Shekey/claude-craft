---
type: llm
---
apps/mobile/lib/location.ts returns { lat: 0, lon: 0 } when neither a current nor a remembered location exists, so callers silently store or use a position in the Gulf of Guinea.

PASS if the response reports this as a bug or a defect (any severity except minor), naming the 0,0 fallback or locationOrDefault. FAIL if it is missing, or only mentioned as a minor or style item.
