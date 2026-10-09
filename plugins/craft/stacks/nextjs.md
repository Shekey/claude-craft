# Stack pack: Next.js

Read before writing code in a Next.js app. The repo's conventions, config and existing code win wherever they differ from this pack. Never add a library from here to a repo that doesn't already use it, unless the task asks.

## First, find out what the repo uses
- Router: App Router (`app/`), Pages Router (`pages/`) or both. Follow the router of the area you touch; don't migrate unasked.
- Next.js version (`next` in package.json) and its config (`next.config.*`): caching mode, `experimental` flags, `output`.
- Data: server components with direct data access, a query layer, tRPC, server actions, route handlers, or a separate API. ORM: Prisma, Drizzle or none.
- Auth library, validation (Zod, Valibot), styling (Tailwind, CSS modules), forms, client state.
- Tests: Vitest or Jest with Testing Library, Playwright for end to end. Lint: ESLint (`eslint-config-next`) or Biome.

## Rules
- Server components by default. `"use client"` goes on the smallest interactive leaf, never at the top of a page tree.
- Fetch data on the server (server component, server action, route handler), not in a client `useEffect` (D5).
- Every server action and route handler is a public endpoint: validate input with a schema, check auth and ownership inside it, return a typed result. Never trust a hidden form field or a client-sent id.
- Secrets stay server-side: only `NEXT_PUBLIC_` values reach the client, and `import "server-only"` guards modules that must never be bundled for it.
- `page.tsx`, `layout.tsx` and `route.ts` stay thin: read params and search params, call the module that owns the work, render (D6).
- Be explicit about caching and revalidation for each fetch or cached function in the version the repo uses; after a mutation, revalidate the affected path or tag.
- `loading.tsx` and `error.tsx` per route segment that can wait or fail; `notFound()` for missing entities.
- Images through `next/image`, fonts through `next/font`, links through `next/link`.
- Don't pass large objects or functions from server to client components; pass ids and plain data.

## Design signals
- D5: `useEffect` + `fetch` in a client component where a server component fits; database calls in a component file.
- D6: a `page.tsx` or route handler with mapping, validation and business rules inline.
- D7: the same Zod schema or DTO mapping written in a server action and a route handler.
- D9: auth and plan checks repeated per page instead of one helper or layout check.
- Not a finding: a client component that owns real interactivity; colocated `_components` folders when the repo uses them.

## Boundaries
- `app/` holds routes only; features live in `src/` (feature folders, or FSD with `app/` rendering `pages` slices: see `craft:architect` reference). Server-only code in modules marked `server-only`.
- Enforce with dependency-cruiser (`templates/dependency-cruiser.fsd.cjs` or a feature-folder rule) as a `lint:arch` script; verify runs it.

## Tests
- Business logic, schemas and server actions' logic as unit tests (extract them from the action so they test without a request).
- Client components with Testing Library by role. Async server components are best covered end to end with Playwright where the repo has it.

## Verify
The Stop hook runs the repo's lint, `tsc --noEmit` (or `typecheck` script) and related tests. `next build` is slow and catches server/client boundary errors; run it by hand after changing `"use client"` boundaries or route config.
