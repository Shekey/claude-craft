# Stack pack: Kotlin and Java (Android, JVM backends)

Read before writing Kotlin or Java code. The repo's conventions, build config and existing code win wherever they differ from this pack. Never add a library or plugin from here to a repo that doesn't already use it, unless the task asks.

## First, find out what the repo uses
- Build: Gradle Kotlin DSL or Groovy, version catalog (`gradle/libs.versions.toml`), convention plugins in `build-logic/`, or Maven.
- Android: Compose or Views, Hilt, Koin or manual DI, Navigation Compose, Room, Retrofit or Ktor, Coroutines and Flow or RxJava.
- Backend: Spring Boot, Ktor, Micronaut or Quarkus; JPA, jOOQ or Exposed.
- Format and lint: ktlint, Spotless, detekt, Checkstyle, Error Prone. Tests: JUnit 4 or 5, kotlinx-coroutines-test, Turbine, MockK or Mockito, AssertJ.
- Java version (toolchain) and whether new code is Kotlin or Java. Match the module you are in.

## Rules
- Kotlin: `val` over `var`, data classes for values, sealed interfaces for states and results, no `!!` where a type or early return works (D10).
- Coroutines: structured concurrency only. `viewModelScope`/`lifecycleScope` on Android, injected dispatchers, no `GlobalScope`, no `runBlocking` outside tests and `main`.
- Android ViewModels expose one `StateFlow<UiState>` and take intents as functions; they hold no `Context`, `View` or `Activity`.
- Composables are stateless where possible: state hoisted, events up as lambdas. Side effects in `LaunchedEffect` only for UI events.
- Repositories own data sources and mapping between DTO, entity and domain models. Map once, next to the type (D7).
- Java: records for values, `Optional` only as a return type, constructor injection, no field injection, immutability by default. Sealed interfaces and pattern matching when the toolchain is 21+.
- Spring: controllers parse and validate (`@Valid`), services hold use cases, repositories persistence; transactions on service methods, not controllers.
- Never block the main thread: no disk or network on it; StrictMode stays clean.

## Design signals
- D2/D3: several `MutableStateFlow` or `mutableStateOf` fields for one screen; `isLoading` plus `error` plus `data` instead of a sealed `UiState`.
- D5: Retrofit, Room, `SharedPreferences` or `Context` used in a Composable, Activity or Fragment.
- D6: an Activity, Fragment or `@RestController` with business rules or SQL.
- D8: domain rules in a `util` or `common` package; D9: the same error-to-message mapping in many ViewModels.
- Not a finding: a ViewModel that turns intents into UI state for its screen; a long but single-purpose Composable layout.

## Boundaries
- Android: a module or package per feature with `ui` and `data`; `domain` only for logic shared across screens. Backend: feature packages with package-private internals.
- Enforce with Konsist (Kotlin) or ArchUnit (Java, `freeze` for existing violations); both run inside `./gradlew check`, so the verify hook runs them. Recipes in `craft:architect` reference.

## Tests
- Unit tests for ViewModels with `kotlinx-coroutines-test` (`runTest`, a test dispatcher) and Turbine for flows; fakes over mocks for repositories you own.
- Compose UI tests with `createComposeRule` by semantics, not by internal state. Robolectric only where the repo already uses it.
- Spring: slice tests (`@WebMvcTest`, `@DataJpaTest`) before `@SpringBootTest`; Testcontainers when the repo uses it.

## Verify
The Stop hook runs `spotlessApply` or `ktlintFormat` when configured, then `./gradlew check` in the nearest Gradle project. On a large build, pin a narrower task in craft.json (`"verify": ["./gradlew :app:testDebugUnitTest :app:lintDebug"]`).
