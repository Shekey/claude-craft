---
type: llm
---

app/fit.tsx is an expo-router route file of about 370 lines that defines the whole screen: five components (Fit, GoodFit, ItemCard, AltRow, Falls), a genericDetail helper and an icon map. The other route files (index, plan, add-item) only render a screen from features/.

PASS if the response reports app/fit.tsx as a route file that holds the whole screen (thin entry point, D6, or a fat route file), and the fix moves the screen into a feature or page folder (for example features/fit/) with the route file only rendering it, and the components split into their own files.
FAIL if app/fit.tsx is not flagged, or is flagged only for its length with no fix that moves the screen out of the route file.
