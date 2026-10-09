# Architecture reference

## Feature-Sliced Design v2.1 (frontend web, React Native)

Layers, top to bottom. A module imports only from layers below it.

| Layer | Holds | Sliced |
|---|---|---|
| `app` | providers, routing setup, global styles, entry | no |
| `pages` | one slice per route or screen | yes |
| `widgets` | large self-contained UI blocks reused across pages; use sparingly | yes |
| `features` | user actions with business value (add-to-cart, login form) | yes |
| `entities` | business entities (user, recipe, order): model, API, small UI | yes |
| `shared` | UI kit, lib helpers, API client, config; no business logic | no (segments only) |

Rules:
- No imports from a higher layer. No imports between slices of the same layer.
- Each slice exposes a public API through `index.ts`; others import only from it.
- Segments inside a slice by purpose: `ui`, `model`, `api`, `lib`, `config`.
- Start with `pages` and `shared`; extract to `features` or `entities` only when reused or when a page grows too large. Do not create a slice with one tiny file.
- Next.js App Router: keep `app/` (routes) as thin files that render `pages` slices; put FSD layers in `src/`.
- Cross-entity relations: use `@x` notation (`entities/user/@x/order.ts`) only when unavoidable.

Optional: Steiger (`steiger`), the official FSD linter, checks slice structure and public APIs. Add it as a `lint:fsd` script if the repo wants those checks in addition to the dependency rules.

## Backend feature modules

```
src/
  modules/
    orders/
      index.ts          public API: the only file other modules import
      orders.routes.ts  transport (HTTP, queue handlers)
      orders.service.ts use cases
      orders.repo.ts    persistence
    billing/
  shared/               config, logging, db client, errors; no business logic
  main.ts
```

Rules: modules talk only through `index.ts`; `shared` never imports `modules`; no cycles between modules. When a module needs to fake or swap an external system, define a port (interface) in the module and an adapter beside it (`orders.payment-port.ts`, `orders.stripe-adapter.ts`). Do not add ports for things that never change.

## dependency-cruiser (TS/JS)

Install: `pnpm add -D dependency-cruiser` (use the repo's package manager). Copy a template from the craft templates folder (its path is given in the architect skill) to `.dependency-cruiser.cjs` at the root and set `SRC`:
- `dependency-cruiser.fsd.cjs`: FSD layers, no same-layer slice imports, public API, no cycles
- `dependency-cruiser.modules.cjs`: backend modules, public API, shared must not import modules, no cycles

Add a script: `"lint:arch": "depcruise src --config .dependency-cruiser.cjs --output-type err --ignore-known"` (drop `--ignore-known` if there is no baseline).

Baseline for an existing codebase:
```bash
pnpm exec depcruise src --config .dependency-cruiser.cjs --output-type baseline --output-to .dependency-cruiser-known-violations.json
```
Regenerate it after each migration step so it only shrinks. The craft verify hook passes `--ignore-known` automatically when the baseline file exists.

Path aliases (`@/features/...`) resolve through `options.tsConfig`, already set in the templates.

TypeScript 7: dependency-cruiser reads TypeScript through the `typescript` package API, which supports versions below 7 only. On a TypeScript 7 repo it silently analyses 0 modules. Keep `typescript@^6` installed as a dev dependency for it, and check the run prints a non-zero module count. The craft verify hook fails the check when 0 modules are analysed.

## Konsist (Kotlin, Android)

Add `testImplementation("com.lemonappdev:konsist:<latest>")` to a test module, then a test such as:

```kotlin
class ArchitectureTest {
    @Test
    fun `features do not depend on each other`() {
        Konsist.scopeFromProject().files
            .assertTrue { file ->
                val feature = file.packagee?.name?.substringAfter("feature.")?.substringBefore(".") ?: return@assertTrue true
                file.imports.none { it.name.contains(".feature.") && !it.name.contains(".feature.$feature.") }
            }
    }

    @Test
    fun `ui does not import data`() {
        Konsist.scopeFromProject().files
            .withPackage("..ui..")
            .assertFalse { file -> file.imports.any { it.name.contains(".data.") } }
    }
}
```

Konsist tests run inside `./gradlew check`, so the craft verify hook already runs them. Adapt package names to the repo.

## ArchUnit (Java)

```java
@AnalyzeClasses(packages = "com.example")
class ArchitectureTest {
    @ArchTest
    static final ArchRule layers = layeredArchitecture().consideringAllDependencies()
        .layer("Web").definedBy("..web..")
        .layer("Service").definedBy("..service..")
        .layer("Persistence").definedBy("..persistence..")
        .whereLayer("Web").mayNotBeAccessedByAnyLayer()
        .whereLayer("Service").mayOnlyBeAccessedByLayers("Web")
        .whereLayer("Persistence").mayOnlyBeAccessedByLayers("Service");

    @ArchTest
    static final ArchRule noCycles = slices().matching("com.example.(*)..").should().beFreeOfCycles();
}
```

Existing violations: ArchUnit's `FreezingArchRule.freeze(rule)` stores them so only new ones fail.

## import-linter (Python)

In `pyproject.toml`:

```toml
[tool.importlinter]
root_package = "app"

[[tool.importlinter.contracts]]
name = "Modules are independent"
type = "independence"
modules = ["app.modules.orders", "app.modules.billing"]

[[tool.importlinter.contracts]]
name = "Shared does not import modules"
type = "forbidden"
source_modules = ["app.shared"]
forbidden_modules = ["app.modules"]
```

Existing violations: list them under `ignore_imports` in the contract and remove entries as they are fixed. The craft verify hook runs `lint-imports` when this config exists.

## Go

Put module-private code under `internal/` so the compiler blocks outside imports. For layer rules, add depguard to `.golangci.yml`:

```yaml
linters:
  enable: [depguard]
linters-settings:
  depguard:
    rules:
      domain:
        files: ["**/internal/*/domain/**"]
        deny:
          - pkg: "database/sql"
            desc: domain must not depend on persistence
```

The craft verify hook runs `golangci-lint` when a config exists.
