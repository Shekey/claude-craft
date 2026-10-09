# Stack pack: NestJS

Read before writing code in a NestJS service. The repo's conventions, config and existing code win wherever they differ from this pack. Never add a library from here to a repo that doesn't already use it, unless the task asks.

## First, find out what the repo uses
- Transport: HTTP (Express or Fastify adapter), GraphQL (code first or schema first), microservices, queues (BullMQ).
- Persistence: Prisma, TypeORM, MikroORM, Drizzle or Mongoose; where repositories live.
- Validation: `class-validator` with a global `ValidationPipe`, or Zod pipes. Config: `@nestjs/config` with a validated schema.
- Module layout: one module per feature, or layered folders. Monorepo (`nest-cli.json` projects, Nx) or single app.
- Tests: Jest (`*.spec.ts` beside the code, `test/*.e2e-spec.ts`) or Vitest with SWC. Lint: ESLint or Biome.

## Rules
- One module per feature. A module exports only the providers other modules need; everything else stays internal.
- Controllers and resolvers stay thin: DTO in, call one service method, map the result out (D6). No ORM calls, no business rules.
- Services hold use cases. Persistence sits behind a repository or the ORM client inside the module; don't spread raw queries across services.
- Every input is validated at the boundary: DTO classes with validation decorators and `whitelist: true, forbidNonWhitelisted: true`, or a schema pipe. Params are parsed (`ParseIntPipe`, `ParseUUIDPipe`).
- Auth and authorization in guards; cross-cutting concerns in interceptors, pipes and exception filters, configured once (D9).
- Throw Nest HTTP exceptions only in the transport layer; domain code throws domain errors that a filter maps.
- Inject everything through constructors. Custom providers (`useFactory`, tokens) only at real boundaries (external clients, config).
- Avoid `forwardRef` for circular module dependencies; fix the cycle by moving the shared piece into its own module.
- Config read through the config service, validated at startup; no `process.env` deep in services.

## Design signals
- D1/D6: a controller with queries, mapping and rules; a service method that validates, writes, sends email and calls a third party.
- D5: a service reading `Request`/`Response` objects.
- D7: the same entity-to-response mapping in several services; DTOs duplicated between create and update instead of `PartialType`.
- D8: domain rules in a `common` or `shared` module.
- D9: repeated try/catch translating the same errors in many controllers instead of one exception filter.
- Not a finding: a module with a single provider; a thin controller with many endpoints.

## Boundaries
- Feature modules under `src/modules/<name>` with a public `index.ts`; `shared` never imports modules (see `craft:architect` reference, backend modules).
- Enforce with dependency-cruiser (`templates/dependency-cruiser.modules.cjs`) as a `lint:arch` script; verify runs it. Nest's DI already blocks unexported providers at runtime; the import rule catches direct file imports.

## Tests
- Unit tests with `Test.createTestingModule` and fakes for repositories and external clients.
- e2e tests with Supertest against the app module and a real test database (or Testcontainers) when the repo has them; guard and pipe behavior belongs there.

## Verify
The Stop hook runs the repo's lint, `tsc --noEmit` (or `typecheck` script) and `jest --findRelatedTests` or `vitest related` for the changed files. Run the e2e suite by hand after changing guards, pipes or module wiring.
