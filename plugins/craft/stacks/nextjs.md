# Stack pack: Next.js

Read before writing code in a Next.js app; the React pack's component rules (view functions, effects, keys, hooks) apply to its components too. The repo's conventions, config and existing code win wherever they differ from this pack. Never add a library from here to a repo that doesn't already use it, unless the task asks.

## First, find out what the repo uses
- Router: App Router (`app/`), Pages Router (`pages/`) or both. Follow the router of the area you touch; don't migrate unasked.
- Next.js version (`next` in package.json) and its config (`next.config.*`). It decides the APIs: `params` and `searchParams` are promises from 15 on; 16 renames `middleware.ts` to `proxy.ts` and adds Cache Components (`"use cache"`, `cacheLife`, `cacheTag`). Use the version's own APIs, never a mix.
- Data: server components with a data access layer, a query layer (TanStack Query), tRPC, server actions, route handlers, or a separate API. ORM: Prisma, Drizzle or none.
- Auth library, validation (Zod, Valibot), styling (Tailwind, CSS modules), component library (shadcn/ui when `components.json` exists), forms, client state.
- Tests: Vitest or Jest with Testing Library, Playwright for end to end. Lint: ESLint (`eslint-config-next`) or Biome.

## Shape of a feature
Routes are wiring; the feature folder owns the work:
- `app/items/[id]/page.tsx`: awaits params, calls one loader, `notFound()` when missing, renders `<ItemScreen item={item} />`. Also `loading.tsx` and `error.tsx` where the segment can wait or fail.
- `features/items/server/queries.ts`: `import "server-only"`, reads data, checks the session and ownership, returns a DTO with only the fields the UI needs.
- `features/items/actions.ts`: `"use server"` mutations: parse input with the shared schema, check auth inside the action, write, revalidate, return a typed result (`{ ok: true } | { ok: false, errors }`).
- `features/items/schema.ts`: the one schema the form, the action and any route handler share (D7).
- `features/items/ItemScreen.tsx` (server by default), client leaves such as `ItemForm.tsx` (`"use client"`, `useActionState` over the action), and `item-view.ts` pure functions that turn the DTO into what the screen shows, with unit tests (D11).

## Rules
- Server components by default. `"use client"` goes on the smallest interactive leaf, never at the top of a page tree.
- Fetch on the server (server component, server action, route handler), not in a client `useEffect` (D5). With TanStack Query, prefetch on the server and hydrate.
- Data access layer: every read of user data goes through `server-only` functions that verify the session next to the query. Middleware or `proxy.ts` auth is an optimistic redirect only, never the check that protects data.
- Every server action and route handler is a public endpoint: validate input with a schema, check auth and ownership inside it, return a typed result. Never trust a hidden form field or a client-sent id.
- Secrets stay server-side: only `NEXT_PUBLIC_` values reach the client.
- `page.tsx`, `layout.tsx` and `route.ts` stay thin: read params, call the module that owns the work, render (D6). Thin means what design.md D6 says; `repo.mjs layout` and `signals` check App Router `page.*` files and Pages Router pages.
- Be explicit about caching and revalidation for each fetch or cached function in the version the repo uses; after a mutation, revalidate the affected path or tag.
- Images through `next/image`, fonts through `next/font`, links through `next/link`.
- Pass ids and plain data from server to client components, not large objects or functions.

## Design signals
- D5: `useEffect` + `fetch` in a client component where a server component fits; database calls in a component file.
- D6: a `page.tsx` or route handler with mapping, validation, business rules or the screen's markup inline.
- D7: the same Zod schema or DTO mapping written in a server action and a route handler.
- D9: auth and plan checks repeated per page instead of the data access layer or one layout check.
- D11: a server or client component that filters, sorts or picks copy from the DTO in its body.
- Not a finding: a client component that owns real interactivity; colocated `_components` folders when the repo uses them; a page that awaits one loader and branches on `notFound()`.

## Boundaries
- `app/` holds routes only; features live in `src/features` (or FSD with `app/` rendering `pages` slices: see `craft:architect` reference). Server-only code in modules marked `server-only`.
- Enforce with dependency-cruiser (`templates/dependency-cruiser.fsd.cjs` or a feature-folder rule) as a `lint:arch` script; verify runs it. Add a rule that client components never import `server/` modules.

## Tests
- Schemas, view functions and the logic inside server actions as unit tests (extract the logic so it tests without a request).
- Client components with Testing Library by role. Async server components are best covered end to end with Playwright where the repo has it.

## Verify
The Stop hook runs the repo's lint, `tsc --noEmit` (or `typecheck` script) and related tests. `next build` is slow and catches server/client boundary errors; run it by hand after changing `"use client"` boundaries or route config.
