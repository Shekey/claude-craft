# Stack pack: Angular

Read before writing code in an Angular app. The repo's conventions, config and existing code win wherever they differ from this pack. Never add a library from here to a repo that doesn't already use it, unless the task asks.

## First, find out what the repo uses
- Angular version (`@angular/core`): standalone components or NgModules, signals (`signal`, `computed`, `input()`, `output()`, `model()`), built-in control flow (`@if`, `@for`) or `*ngIf`/`*ngFor`, zoneless or Zone.js, `inject()` or constructor injection. Match the area you touch; don't migrate unasked.
- State: services with signals, NgRx Store, NgRx SignalStore, or RxJS subjects. Data: `HttpClient` in services, `httpResource`/`resource`, or a query library.
- Forms: typed reactive forms, template-driven forms, or signal forms. UI: Angular Material and CDK, PrimeNG, spartan/ui (shadcn-style), or own components. Styling: SCSS, Tailwind.
- Tests: Vitest, Jest, or Karma and Jasmine; Playwright or Cypress for end to end. Lint: angular-eslint, Prettier or Biome. Nx workspace or the Angular CLI.

## Rules
- Routed components stay thin: they read route params (`withComponentInputBinding` inputs) and render presentational components with what a store or facade provides (D6). Route config lives in `*.routes.ts` with lazy `loadComponent`/`loadChildren`.
- A feature folder holds its routes, its page component, its presentational components (one per file), its store or facade service and its pure view functions.
- Components render a prepared view. Derivation from domain data (filtering lists, picking a case, parsing strings, date comparisons) goes in pure functions next to the feature; a feature store or facade exposes `computed` view signals and intent methods (D11). Templates call no methods that compute; they read signals and bind events.
- Presentational components take `input()`s and emit `output()`s, use `ChangeDetectionStrategy.OnPush`, and inject no data services.
- `computed` for derived state, never an `effect` that writes a signal copied from another (D4). `effect` only for syncing with the outside (storage, DOM, logging).
- `HttpClient` only inside services; components never call it (D5). Server data lives in one place (the store or resource), not copied into component fields.
- RxJS: subscriptions end with the component (`takeUntilDestroyed`, `toSignal`, or the `async` pipe); no nested `subscribe`; flatten with the right operator (`switchMap` for searches, `exhaustMap` for submits).
- Cross-cutting concerns in one place (D9): functional interceptors for auth headers and error mapping, functional guards (`CanActivateFn`) for access, resolvers only where a page can't render without the data.
- Angular's DI is the seam: `providedIn: 'root'` for app-wide services, component or route providers for scoped ones, `InjectionToken` for config and for things really swapped. No extra container.
- `@for` with a `track` on a stable id. Accessibility: semantic elements, CDK a11y for dialogs and focus, labels on inputs.
- Never put secrets in `environment.ts`; everything there ships to the browser.

## Design signals
- D2/D3: several `signal`s or fields describing one form or entity; `loading`, `error` and `data` flags instead of one status union or a resource's status.
- D4: an `effect` or `ngOnChanges` copying inputs into local state; a subscription that writes a field another field derives from.
- D5: `HttpClient`, `localStorage` or analytics calls in a component.
- D6: a routed component that fetches, maps and holds the screen's markup itself.
- D11: template expressions or getters that filter or pick copy from domain data.
- Not a finding: a component that only binds a store's signals to presentational children; a service with many small methods for one resource.

## Boundaries
- Feature folders with a public `index.ts`; `shared` holds no business logic. In an Nx workspace use its module boundary tags (`@nx/enforce-module-boundaries`); otherwise dependency-cruiser as a `lint:arch` script, which verify runs.

## Tests
- View functions, stores and services as unit tests (services with `HttpTestingController`). Components with `TestBed` or Angular Testing Library by role, with stores faked through providers.

## Verify
The Stop hook runs the repo's lint, its `typecheck` script (or `tsc --noEmit`, which does not check templates) and related tests. Run `ng build` by hand after template or routing changes; it type-checks templates.
