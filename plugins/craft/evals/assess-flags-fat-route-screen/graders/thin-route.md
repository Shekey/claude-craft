---
type: llm
---

app/fit.tsx is an expo-router route file of about 370 lines that defines the whole screen: five components (Fit, GoodFit, ItemCard, AltRow, Falls), a genericDetail helper and an icon map. The other route files (index, plan, add-item) only render a screen from features/.

PASS if the response reports app/fit.tsx as a route file that holds the whole screen (thin entry point, D6, a fat route file, or too many components in the route), and the fix moves the screen out of the route file into a feature or page folder (for example features/fit/), leaving the route file to only render it. Splitting the components into their own files is welcome but not required.
FAIL if app/fit.tsx is not flagged, or is flagged only for its length or component count with no fix that moves the screen out of the route file.
