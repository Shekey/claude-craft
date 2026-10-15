# Stack pack: TanStack (Start, Router, Query, Form, Table, Virtual)

Read before writing code in a TanStack Start app, or in any app that uses TanStack libraries; read only the sections for the libraries the repo has. Components follow the React pack. The repo's conventions, config and existing code win wherever they differ from this pack. Never add a TanStack library to a repo that doesn't already use it, unless the task asks.

## First, find out what the repo uses
- Which `@tanstack/*` packages and versions are in package.json. Start and Router APIs moved during 1.x (for example `.validator()` became `.inputValidator()` on server functions, and server routes moved into `createFileRoute`); use the installed version's API.
- Router: file-based (`src/routes`, the router plugin generating `routeTree.gen.ts`) or code-based route trees. Router context (`createRootRouteWithContext`) carrying the query client or auth.
- Data: Router loaders alone, or loaders that prime TanStack Query (`ensureQueryData`) and components that read with `useSuspenseQuery`.
- Validation: Zod, Valibot or ArkType through Standard Schema. Component library (shadcn/ui when `components.json` exists). Tests: Vitest with Testing Library; Playwright for end to end.

## Start
- Server functions (`createServerFn`) live in the feature (`features/posts/server.ts`), not in route files. Each one validates input with a schema (`.inputValidator`), checks auth inside the handler, and returns plain serializable data.
- Cross-cutting server concerns (auth context, logging) go in `createMiddleware`, attached once; not repeated in every handler (D9).
- Secrets only in server code; client-visible env vars (`VITE_`) are public.
- SSR and hydration: no `window` or `Date.now()` differences between server and client render; read browser-only values in effects or client-only components.

## Router
- Route files stay thin: `export const Route = createFileRoute(...)({ loader, beforeLoad, validateSearch, component })`, where `component` is imported from the feature folder or is a short function that reads `Route.useLoaderData()` / `Route.useParams()` and renders the screen. Components, helpers and server functions live in the feature, never in `src/routes` (D6); `repo.mjs layout` and `signals` check route files (`__root` and `-` prefixed files are skipped).
- Never edit `routeTree.gen.ts`; it is generated.
- Search params are state: declare them with `validateSearch` and a schema, read them with `Route.useSearch()`, change them with typed `navigate`/`Link`. No parallel `useState` copy (D4).
- Auth and redirects in `beforeLoad` on a pathless layout route (`_authed.tsx`) that guards its children, not per page (D9).
- `loaderDeps` for search params a loader depends on, so caching keys are right. Pending and error UI per route (`pendingComponent`, `errorComponent`, `notFoundComponent`).
- Typed links only: `<Link to="/posts/$id" params={{ id }}>`, never string-built paths.

## Query
- One `queryOptions()` factory per query, next to the feature's API (`postQueries.detail(id)`), so the key and fetcher are built once (D7). Loaders call `queryClient.ensureQueryData(postQueries.detail(id))`; components use `useSuspenseQuery` with the same options.
- Server data stays in the cache; never copy it into `useState` or a store with an effect (D4).
- Mutations own the request, `invalidateQueries` (or `setQueryData`) for affected keys, and analytics; components call `mutate` with intent-level arguments.
- Status from the query (`isPending`, `isError`), not hand-made loading flags (D3). Set `staleTime` deliberately where refetching matters.

## Form
- `useForm` (or the app's `createFormHook` fields) with a schema validator; the same schema validates on the server (D7).
- Field components from the app's form kit; no ad-hoc `useState` per field (D2).
- Submit calls a mutation or server function and maps server errors back to fields in one place.

## Table and Virtual
- Column definitions outside the component (or memoized) and typed with `createColumnHelper`; data stable between renders.
- Server-side sorting, filtering and pagination use `manual*` options with the state in search params.
- Long lists and tables use `useVirtualizer` rather than rendering every row.

## Design signals
- D4: query or loader data copied into `useState`; search params mirrored in state.
- D5: `fetch` in `useEffect` when a loader or query fits; server functions called inline in a component body instead of through a mutation or loader.
- D6: a route file defining its page's components, helpers or server functions.
- D7: query keys written as literal arrays in several places; the same schema written for the form and the server function.
- D9: auth checks repeated in route loaders instead of one `beforeLoad` or middleware.
- Not a finding: a route file with `loader`, `beforeLoad` and `validateSearch` configuration; a small route component that only reads route hooks and renders the screen.

## Tests
- Query factories, view functions and server function logic as unit tests. Components with Testing Library, wrapping them in a `QueryClientProvider` with a fresh client per test (retries off). Routes with a test router (`createMemoryHistory`) when the repo does that.

## Verify
The Stop hook runs the repo's lint, `tsc --noEmit` (or `typecheck` script) and related tests. Run the router generator or dev server after adding route files so `routeTree.gen.ts` and route types are current.
