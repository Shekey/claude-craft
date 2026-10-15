# Stack pack: React Native and Expo

Read before writing code in a React Native or Expo app. The repo's conventions, config and existing code win wherever they differ from this pack. Never add a tool or library from here to a repo that doesn't already use it, unless the task asks.

## First, find out what the repo uses
- Navigation: expo-router (`app/` routes) or React Navigation (a navigator tree).
- Server state: TanStack Query, RTK Query, SWR or hand-written hooks. Client state: Zustand, Redux, Jotai or context.
- Styling: StyleSheet, NativeWind, Tamagui, Unistyles. Forms: react-hook-form, Formik or plain state.
- Workflow: managed (CNG, `android/` and `ios/` generated and ignored) or bare (`android/` and `ios/` committed). In CNG, native changes go through config plugins and `app.json`/`app.config.ts`, never by editing generated folders.
- Tests: jest-expo or the `react-native` Jest preset with React Native Testing Library. Lint: ESLint (`eslint-config-expo`) or Biome.

## Rules
- Route files stay thin (design.md D6): `app/fit.tsx` reads params and renders `features/fit/FitScreen`. Besides the default export only expo-router's own (`ErrorBoundary`, `unstable_settings`, `generateStaticParams`); extra exports also make Fast Refresh reload the whole module. Nothing imports from `app/`.
- A screen folder holds the screen, one file per component that has its own props or reason to change, and the screen's logic: `features/fit/FitScreen.tsx`, `GoodFit.tsx`, `ItemCard.tsx`, `fit-view.ts` (+ `fit-view.test.ts`), `useFitScreen.ts`.
- Components render a prepared view. Deriving what to show from domain data (filtering its lists, picking a case, parsing strings, date comparisons) goes in pure functions next to the screen; a view-model hook (`useFitScreen()`) composes the store, mutations and navigation and returns `{ view, actions }` (D11).
- No DI container. Hooks, props and module imports are the seams; tests mock modules (`jest.mock`). Add a port only for something really swapped, such as a vendor SDK or a platform API.
- Device APIs (camera, image picker, location, notifications, permissions, secure storage) live in a hook per capability that returns intent-level functions and a typed status (`useCameraPermission()` → `{ status, request }`). Screens never call `ImagePicker` or `Location` directly (D5).
- Permissions are a state machine: `undetermined | granted | denied | blocked`; handle "blocked" with a link to settings.
- Server data lives in the query cache, not copied into `useState` with an effect (D4). Mutations own the API call, cache invalidation and analytics.
- Secrets never ship in the bundle: `EXPO_PUBLIC_` variables are public. Tokens go in `expo-secure-store`, not AsyncStorage.
- Lists: `FlatList`/`FlashList` with stable `keyExtractor`; no `.map()` over long data in a ScrollView.
- Platform differences: `Platform.select` or `.ios.tsx`/`.android.tsx` files, not scattered `Platform.OS` checks.
- Accessibility: `accessibilityRole` and `accessibilityLabel` on touchables and icons; touch targets at least 44pt.
- Animations on the UI thread (Reanimated) when the repo uses it; no `setState` per frame.

## Design signals
- D2: five or more `useState` calls for one form or entity, or the same setters called from an effect and a handler.
- D3: `isLoading`, `error`, `data` and `isEmpty` as separate flags; photo `uri` plus `existing` plus `removed` booleans.
- D4: `useEffect(() => setX(props.x), [props.x])`; a `useRef` "loaded once" guard around form initialisation.
- D5: `fetch`, the API client, `AsyncStorage`, `track()` or `router.push` decisions inline in a screen.
- D6: a file in `app/` that does more than render a screen, however short (`repo.mjs layout` lists them under route files). Two route styles side by side is a repo pattern for the keep / gradual / now decision.
- D11: `.filter`, `.find`, `.split(...)[0]`, date comparisons or copy chosen from domain fields in a component body; a `detailFor(kind, entity)` helper below the components.
- D8: entity rules (price, status transitions) in `utils/` or `lib/`.
- Not a finding: a screen component (not a route file) that renders and wires named hooks and calls named view functions; formatting a single value inline; inline styles when the repo uses them.

## Boundaries
- Small app: feature folders. Growing app: Feature-Sliced Design with expo-router `app/` as thin routes over `src/pages` (see `craft:architect` reference).
- Enforce with dependency-cruiser (`templates/dependency-cruiser.fsd.cjs`) as a `lint:arch` script; verify runs it.
- Native code in a committed `android/` folder follows the Kotlin pack and is verified with Gradle.

## Tests
- Logic (mappers, view functions, reducers, validation, state machines) as plain unit tests: fastest and most valuable.
- Hooks with `renderHook`; screens with React Native Testing Library by role and text, not test IDs or snapshots.
- Mock native modules at the module boundary (`jest.mock("expo-image-picker")`), never the hook under test.

## Verify
The Stop hook runs the repo's lint, `tsc --noEmit` (or `typecheck` script) and `jest --findRelatedTests` for the changed files; Gradle `check` for files in a committed `android/`. `npx expo-doctor` is worth running by hand after dependency changes.
