# Stack pack: Vue and Nuxt

Read before writing code in a Vue 3 or Nuxt app. The repo's conventions, config and existing code win wherever they differ from this pack. Never add a library from here to a repo that doesn't already use it, unless the task asks.

## First, find out what the repo uses
- Vue or Nuxt version (Nuxt 4 puts the app in `app/`), Options or Composition API, `<script setup lang="ts">` or not.
- State: Pinia, plain composables, or both. Data: `useFetch`/`useAsyncData`, TanStack Query (Vue Query), or hand-written composables over `$fetch`.
- UI: Nuxt UI, shadcn-vue (`components.json`), Vuetify, PrimeVue, or own components. Styling: Tailwind, UnoCSS, scoped CSS.
- Nuxt auto-imports (components, composables, utils) and any layers (`extends`) that split features.
- Tests: Vitest with `@vue/test-utils` or `@nuxt/test-utils`; Playwright for end to end. Lint: `@nuxt/eslint`, `eslint-plugin-vue`, or Biome.

## Rules
- Pages stay thin: `pages/items/[id].vue` reads the route and renders the feature's screen component (`<ItemScreen :id="id" />`), plus `definePageMeta` and head tags. No data shaping, extra components or business rules in the page (D6); `repo.mjs layout` and `signals` check Nuxt pages.
- A feature keeps its screen, its child components (one per file, the Vue default), its composables and its view functions together (`components/items/`, `composables/items/`, or a layer per feature, whichever the repo uses).
- Components render a prepared view. Derivation from domain data (filtering lists, picking a case, parsing strings, date comparisons) goes in pure functions next to the feature; one screen composable (`useItemScreen()`) composes data, store and navigation and returns `{ view, actions }` (D11). Templates stay free of logic beyond simple conditions and loops.
- `computed` for derived values, never a `watch` that writes state copied from props or fetched data (D4). Props are read-only; use `defineModel` or emits for two-way binding.
- In Nuxt, fetch with `useFetch`/`useAsyncData` (with a stable key) so data loads once during SSR; `$fetch` only in event handlers and actions. No fetching in `onMounted` (D5).
- Pinia for client state shared across screens only; server data is not copied into a store. Stores expose actions with intent names; components don't mutate store state directly.
- Server routes (`server/api/*.ts`) are public endpoints: validate with a schema (`readValidatedBody`, `getValidatedQuery`, `getValidatedRouterParams`), check auth inside the handler, return plain data. Shared logic in `server/utils`, not repeated per handler (D9).
- `runtimeConfig` for settings: only `runtimeConfig.public` reaches the client; secrets never go there or in `NUXT_PUBLIC_` / `VITE_` variables.
- Route guards in named route middleware (`middleware/auth.ts`, `definePageMeta({ middleware: "auth" })`), not repeated per page; server checks still protect the data.
- No DI container. Composables, props and provide/inject are the seams; tests mock modules.
- Accessibility: semantic elements, labels on inputs, focus handling for dialogs and route changes.

## Design signals
- D2: five or more `ref`s describing one form or entity; the same reset steps in several handlers.
- D3: `loading`, `error` and `data` refs instead of the status from `useAsyncData` or one union.
- D4: `watch(() => props.x, (v) => (local.value = v))`; fetched data copied into a store.
- D5: `$fetch` in `onMounted`, `localStorage` or analytics calls inline in components.
- D6: a page with its own data shaping, several sections of markup, or composables other than route and meta.
- D11: `computed`s that filter or pick copy from domain data inside a component instead of a view function.
- Not a finding: a component with one responsibility and a long template; auto-imported components and composables when the repo relies on them.

## Boundaries
- Small app: feature folders inside Nuxt's conventions (`components/<feature>/`, `composables/<feature>/`). Growing app: a Nuxt layer per feature, or FSD for plain Vue (see `craft:architect` reference).
- Enforce with dependency-cruiser as a `lint:arch` script; verify runs it. Auto-imports bypass import rules, so prefer explicit imports across features where boundaries matter.

## Tests
- View functions, composables and store actions as unit tests. Components with `@vue/test-utils` or `@nuxt/test-utils` (`mountSuspended`) by role and text. Server routes through `$fetch` against the test server where the repo has it.

## Verify
The Stop hook runs the repo's lint, its `typecheck` script or `nuxi typecheck` / `vue-tsc --noEmit` (plain `tsc` does not read `.vue` files), and `vitest related` on the changed files.
