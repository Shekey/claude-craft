# Design checklist

Apply each rule to a unit you have read end to end. A finding needs evidence: file, line range, and what you saw. Cite the rule ID.

Kinds:
- **design**: a D1–D9 rule below is broken.
- **structure**: cycles, wrong-way imports, monorepo boundary breaks.
- **bug**: wrong behavior you can describe concretely (input, what happens, what should happen). Bugs found while reading are worth reporting, but label them as bugs and never attach a D rule to one.
- **minor**: local hygiene (D10, wording, small duplication). Never part of a recommended batch.

Severity (design, structure, bug):
- **high**: causes bugs or makes them likely (impossible states, drifting duplicates, state kept in sync by hand), or a bug that loses or corrupts data.
- **medium**: slows every change to the unit (mixed responsibilities, fat entry points, misplaced domain logic), or a bug with a visible but recoverable effect.

## D1 · One responsibility per unit
List the concerns the unit handles: rendering, form state, server I/O, device APIs or permissions, file or image processing, mapping, validation, duplicate or business rules, analytics, navigation decisions, error-to-action policy. More than about three, or two that change for unrelated reasons, is a finding.
Fix: the unit keeps coordination; each other concern moves to a named hook, use case, service or component next to it.

## D2 · One state model, set in one place
Several related state variables (`useState`, `mutableStateOf`, instance fields) that describe one thing, especially when the same set of setters appears in more than one place (initial values, loading for edit, applying a server or AI result, reset).
Fix: one typed object (`Draft`, `UiState`) with pure constructors such as `fromEntity`, `fromParsed`, `empty`.

## D3 · No impossible states
Booleans, nullable fields or parallel flags that together allow combinations that mean nothing (`photo` and `existing` and `removePhoto`; `loading` and `error` and `data` all set).
Fix: a discriminated union or sealed class with one case per real state; derive the rest.

## D4 · Derive, don't sync
State copied from props, route params or loaded data with an effect, often guarded by a ref or a "loaded" flag; state that can be computed from other state.
Fix: compute during render; initialize state from data and remount with a `key` when the source identity changes; for server data, read from the query cache.

## D5 · Side effects at the edges
I/O, permissions, camera or file pickers, storage, analytics and navigation decisions written inline in UI components, route handlers or controllers.
Fix: a hook or use case that owns the effect and exposes intent-level functions (`pickPhoto()`, `saveItem(draft)`).

## D6 · Thin entry points
Route files, page components, controllers, Activities or screen Composables that contain logic instead of wiring.
Fix: the entry point only reads params and renders or calls the slice or module that owns the work.

## D7 · Build each mapping once
The same payload, DTO or field list assembled in two or more places (save and duplicate check, create and update, request and cache key).
Fix: one mapper next to the type (`toPayload(draft)`), used everywhere.

## D8 · Domain logic in its domain
Business rules, entity options, enums, duplicate detection or entity-specific API calls living in `lib/`, `utils/`, `helpers/`, `common/` or `shared/`.
Fix: move to the entity or module that owns the concept (`entities/item`, `modules/orders`); keep `shared` for code with no business meaning.

## D9 · Cross-cutting policy in one place
The same decision repeated across screens or handlers: error kind to user action, auth or plan gating, retry rules.
Fix: extract only after confirming it is repeated (search the repo); one hook or middleware owns it.

## D10 · Visible invariants (minor)
Non-null assertions, unchecked casts, promises without error handling, ignored results, magic values.
Fix: a type, an early return or explicit handling that makes the rule visible.

## Not a finding
Calibration matters as much as detection. Do not report:
- A long unit with one responsibility (a big form layout is still one concern).
- Independent pieces of state that do not describe the same thing.
- A concern that appears once and is already in a named hook, service or component.
- Missing abstractions with only one use today.
- Styling choices (inline styles versus style sheets) and formatting.
- A different but consistent pattern the repo uses everywhere: that is a convention, not a defect.
- A component, screen or controller that renders and wires named hooks, use cases or services: coordinating them is its one responsibility. D1 applies only when the unit implements the concerns itself.
- A screen's own controller hook or ViewModel that holds the screen state and turns user intents into feedback for that screen (messages, confirmation dialogs, navigation): that is the screen's coordination. Flag it only when it also implements I/O, device access or domain rules itself.
- Calling the same pure helper twice: D7 is about rebuilding the same structure by hand in several places.
- Where user-facing wording lives, analytics event details, hard-coded config in a small app: minor at most.
- Missing tests, linters or boundary tools: one line under "Guardrails" after the findings, not a finding. The `enforce` mode handles boundary tooling.
If the units you read have no high or medium findings, say so plainly. Do not pad the list.

## Stack signals

**React / React Native**
- D2: five or more `useState` calls for one form or entity; a function that calls most of the same setters as an effect.
- D4: `useEffect` that calls setters from props or loaded data; `useRef` used as a "loaded once" guard.
- D5: `ImagePicker`, `Permissions`, `fetch` or API client, `AsyncStorage`, `track(...)` called directly in a screen component.
- D6: an expo-router or React Router route file defining the whole screen.
- Fix shapes: `useXForm` returning the model and intent functions; a `useSaveX` mutation owning API, cache refresh and analytics.

**Next.js**
- D6: `page.tsx` or a route handler containing data mapping, validation and business rules.
- D5: data fetched in client components with `useEffect` when a server component or server action fits; `"use client"` at the top of a large tree.
- Fix shapes: fetch in server components or a query layer, push `"use client"` down to the interactive leaf, validate server action input with a schema at the boundary.

**Node backend**
- D6: controllers or route handlers that contain business rules or SQL.
- D5 and D1: services that read `req` or `res`, or that send email, write to the database and call third parties in one function.
- D8: shared `utils` holding order or billing rules.
- Fix shapes: handler parses and validates, a use case per operation, repositories own persistence, external systems behind a port only when they need faking or swapping.

**Kotlin / Android**
- D2 and D3: a ViewModel exposing several `StateFlow`s or `mutableStateOf` fields for one screen instead of one `UiState`; loading, error and content flags instead of a sealed interface.
- D5: `Context`, Retrofit or Room calls in a Composable or an Activity; ViewModel holding Android framework references.
- D6: an Activity or Fragment with business logic.
- Fix shapes: one `UiState` data class or sealed interface, a stateless screen Composable with hoisted state, repositories behind the ViewModel, side effects in `LaunchedEffect` only for UI events.
