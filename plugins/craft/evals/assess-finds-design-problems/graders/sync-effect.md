---
type: llm
---

PASS if the response flags the useEffect plus useRef ('loaded') that copies the edited expense into state, and recommends initializing state from the expense instead (for example by remounting with a key, or deriving it) rather than syncing it with an effect.
FAIL otherwise.
