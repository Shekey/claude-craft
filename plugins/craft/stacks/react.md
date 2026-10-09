# Stack pack: React (web, without Next.js)

Read before writing code in a React web app (Vite, CRA, Remix/React Router framework, or a React package). The repo's conventions, config and existing code win wherever they differ from this pack. Never add a library from here to a repo that doesn't already use it, unless the task asks.

## First, find out what the repo uses
- React version (19 brings actions, `useActionState`, `use`, ref as a prop) and whether the React Compiler is on (then manual `useMemo`/`useCallback` is mostly noise).
- Routing: React Router (library or framework mode), TanStack Router, or none.
- Server state: TanStack Query, RTK Query, SWR, loaders. Client state: Zustand, Redux, Jotai, context.
- Forms and validation, styling (Tailwind, CSS modules, CSS-in-JS), component library.
- Tests: Vitest or Jest with Testing Library; Playwright or Cypress. Lint: ESLint with `react-hooks` rules, or Biome.

## Rules
- Components render; hooks own state and effects; plain functions own logic. A component file that does all three is a D1 candidate.
- Effects are for syncing with something outside React (subscriptions, the DOM, timers). Not for deriving state, not for reacting to events, not for fetching when the repo has a data layer (D4, D5).
- Derive during render. Initialise state from props once and remount with `key` when identity changes; never mirror props into state.
- Server data stays in the query cache or loader data; mutations own invalidation.
- Keys are stable ids, never array indexes for lists that reorder.
- Follow the rules of hooks; never silence `react-hooks/exhaustive-deps`, fix the dependency instead.
- Accessibility: semantic elements first (`button`, `label`, `nav`), labels on inputs, focus management on dialogs and route changes.
- Never put secrets in the bundle: every env var the client reads (`VITE_`, `REACT_APP_`) is public.

## Design signals
- D2: five or more `useState` calls for one form or entity; reset logic duplicated in several handlers.
- D3: `loading`/`error`/`data` booleans instead of one status union; `isOpen` plus `selectedId` that can disagree.
- D4: `useEffect(() => setX(f(props)), [props])`; effects chained to update each other.
- D5: `fetch`, `localStorage`, analytics or navigation decisions inline in components.
- D9: the same error toast mapping in many components.
- Not a finding: a large component with one responsibility; prop drilling two levels deep.

## Boundaries
- Small app: feature folders. Growing app: Feature-Sliced Design (see `craft:architect` reference). A shared component library exports through one entry.
- Enforce with dependency-cruiser (`templates/dependency-cruiser.fsd.cjs`) as a `lint:arch` script; verify runs it.

## Tests
- Pure logic and reducers as unit tests; hooks with `renderHook`; components with Testing Library by role and accessible name, with `user-event`.
- Mock the network at the boundary (MSW when the repo has it), not your own hooks.

## Verify
The Stop hook runs the repo's lint, `tsc --noEmit` (or `typecheck` script) and `vitest related` or `jest --findRelatedTests` on the changed files.
