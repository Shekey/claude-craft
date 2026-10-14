# Design checklist

Apply each rule to a unit you have read end to end. A finding needs evidence: file, line range, and what you saw. Cite the rule ID.

Kinds:
- **design**: a D1–D9 or D11 rule below is broken.
- **structure**: cycles, wrong-way imports, monorepo boundary breaks, and layout problems (see Layout below).
- **bug**: wrong behavior you can describe concretely (input, what happens, what should happen). Bugs found while reading are worth reporting, but label them as bugs and never attach a D rule to one.
- **minor**: local hygiene (D10, wording, small duplication). Never part of a recommended batch.

Severity (design, structure, bug):
- **high**: causes bugs or makes them likely (impossible states, drifting duplicates, state kept in sync by hand), or a bug that loses or corrupts data.
- **medium**: slows every change to the unit (mixed responsibilities, fat entry points, misplaced domain logic), or a bug with a visible but recoverable effect.
- **low**: worth changing but contained and harmless to leave for now (a repo pattern such as several components per file), or a cosmetic bug.

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
A file-router route (expo-router `app/`, React Router `app/routes/`, Next.js `page.tsx` and Pages Router pages, TanStack Router `src/routes/`, Nuxt `pages/*.vue`) is thin when it has one default export (TanStack: the `Route` with a short component) that reads params and renders a screen from a feature or page folder, defines no other components or helpers, and exports nothing else besides the framework's own names (`ErrorBoundary`, `unstable_settings`, `generateStaticParams`, `loader`, `action`, `meta`, `metadata`, `generateMetadata`, `revalidate`, `Route`). A Next.js server page may await one loader and call `notFound()`. Nothing imports from a route file. Size does not make a route thin: a 30-line route that holds state, calls app hooks or lays out the screen itself is a screen in a route file, the same as a 300-line one. For these routers, `repo.mjs layout` and `signals` flag a route that defines 2 or more components, exports anything else, calls hooks other than the router's param and meta hooks (`useLocalSearchParams`, `useParams`, `useLoaderData`, `useSearch`, `useRoute`), renders 4 or more elements, or runs to 80 or more lines. A `<Stack.Screen options>` next to the screen is still thin. A redirect guard belongs in `_layout`, not in a route.
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

## D11 · Views render a prepared view
A component that works out what to show from domain data itself: filtering or searching the domain object's collections, choosing between domain cases, parsing or rebuilding strings, comparing dates, picking copy from domain fields. The signal is three or more such values computed in one component body, or a helper in a component file that takes a domain object and returns display data. These rules hide in JSX, cannot be unit-tested without rendering, and get copied when a second screen needs them.
Fix: pure functions next to the feature that turn domain data into a view (`toFitView(rec, units, now)` returning `{ items, tip, missing, title }`), with plain unit tests. When the screen also needs hooks (store, navigation, mutations), one view-model hook (`useFitScreen()`) composes them and returns `{ view, actions }`; the components only lay out `view` and call `actions`. The hook stays thin: rules live in the pure functions it calls.
Not D11: formatting a single value (`formatClock(t)`), showing or hiding on a prop or flag, one lookup, or derivation that already calls a named function.
Dependency injection: in React and React Native, hooks, props and module imports are the seams, and tests mock modules at the boundary. Do not recommend a DI container or service locator; a port (interface plus adapter) only where an implementation is really swapped (a vendor SDK, a platform API, a fake for tests that module mocks cannot reach).

## D10 · Visible invariants (minor)
Non-null assertions, unchecked casts, promises without error handling, ignored results, magic values.
Fix: a type, an early return or explicit handling that makes the rule visible.

## Layout
Structure findings from `repo.mjs layout`, rule `S`. The question is whether someone can find and change one concern without reading unrelated code.
- **Crowded folder**: 20 or more code files directly in one folder, unless the folder's own role keeps them together (a route folder shaped by the framework, a migrations folder, a UI kit of primitives). Check what the files are about: unrelated concerns side by side (auth, billing, settings, formatting in one `lib/`) is the finding. Fix: group by the feature or entity each file serves; what has no business meaning goes to `shared/` sub-folders by purpose (`api`, `lib`, `ui`).
- **Many components in one file**: 5 or more components in a file of 150 lines or more. Fix: one file per component that has its own state, props or reason to change, in a folder named after the screen or feature (`settings/ui/NotificationsCard.tsx`); tiny private helpers used only by one component can stay with it.
- **Several components per file, repo-wide**: the repo patterns line of `layout` flags it when 3 or more files, and at least a quarter of the files with components (UI kits excluded), hold 3 or more components each. One file per component makes each one findable by name and changeable on its own (single responsibility at file level). Report it as one repo pattern, not one finding per file, severity `low` (`medium` if the files are also long or edited by several features). The user decides whether it stays. A UI kit of small primitives in one file does not count toward it.
- **Screen in a route file**: a route `layout` flags under route files (test in D6). Report it with the screen folder it moves to (`features/onboarding/OnboardingScreen.tsx`, or `pages/onboarding/ui/` under FSD) and any D11 logic inside. One such route is a finding; when the patterns line flags `screens in route files`, it is one repo pattern decided once (keep, gradual or now).
- **Oversized file**: 400 lines or more. Usually a D1 problem in disguise; read it and report the responsibilities, or say why it is one concern (a long form layout).
Severity: medium when it slows every change to the area (a crowded folder that every feature touches, a file several screens edit), minor when it is one isolated file. Never high on its own.

## Not a finding
Calibration matters as much as detection. Do not report:
- A long unit with one responsibility (a big form layout is still one concern).
- Independent pieces of state that do not describe the same thing.
- A concern that appears once and is already in a named hook, service or component.
- Missing abstractions with only one use today.
- Styling choices (inline styles versus style sheets) and formatting.
- A different but consistent pattern the repo uses everywhere that breaks no rule here: that is a convention, not a defect. A pattern that does break a rule (a D rule or the Layout thresholds) is a repo pattern: one finding, and the user decides once whether to keep it, change it gradually or change it now (craft:architect, assess step 3b). A `keep` line in `## Decisions` of the conventions file makes it a convention.
- A component, screen or controller that renders and wires named hooks, use cases or services: coordinating them is its one responsibility. D1 applies only when the unit implements the concerns itself. A screen that computes its view from domain data inline is not wiring (D11), and a route file that defines the whole screen is not thin (D6).
- A screen's own controller hook or ViewModel that holds the screen state and turns user intents into feedback for that screen (messages, confirmation dialogs, navigation): that is the screen's coordination. Flag it only when it also implements I/O, device access or domain rules itself.
- Calling the same pure helper twice: D7 is about rebuilding the same structure by hand in several places.
- Where user-facing wording lives, analytics event details, hard-coded config in a small app: minor at most.
- Missing tests, linters or boundary tools: one line under "Guardrails" after the findings, not a finding. The `enforce` mode handles boundary tooling.
If the units you read have no high or medium findings, say so plainly. Do not pad the list.

## Stack signals

Each stack pack in `${CLAUDE_PLUGIN_ROOT}/stacks/` lists its own design signals and fix shapes; read the pack for the code you are judging. Plain Node backends have no pack:

**Node backend**
- D6: controllers or route handlers that contain business rules or SQL.
- D5 and D1: services that read `req` or `res`, or that send email, write to the database and call third parties in one function.
- D8: shared `utils` holding order or billing rules.
- Fix shapes: handler parses and validates, a use case per operation, repositories own persistence, external systems behind a port only when they need faking or swapping.
