# Conventions · habits

## Stack and tooling
- Expo 54 with expo-router 6, React 19, TypeScript, TanStack Query 5.
- Biome for lint and format (`npm run lint`), `npm run typecheck` for types. No test runner yet.

## Architecture
- Feature-Sliced Design: `app/` holds thin expo-router routes that re-export pages from `src/pages/<page>`.
- `src/pages/<page>/ui/` for screens, `src/entities/habit` for the habit model, queries and streak logic, `src/shared` for the API client, date helpers and the UI kit.
- Slices expose a public `index.ts`; imports go downward only (pages → entities → shared).

## Patterns
- Server data through TanStack Query hooks in `entities/*/api`.
- Styling with inline style objects; shared primitives in `src/shared/ui`.

## Naming
- Components in PascalCase files, helpers in kebab-case files.

## Decisions
- several components per file · gradual · 2026-10-10 · page files hold 3-4 components; new components get their own file in the page's `ui/` folder, existing ones are split when a task touches them.

## Commits
- Short imperative subject lines, no prefixes.

## Verify
- `npm run lint`, `npm run typecheck`.
