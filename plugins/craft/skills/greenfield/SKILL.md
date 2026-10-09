---
name: greenfield
description: Use when starting a new project, package or app from scratch with no existing conventions to follow.
---

# New project defaults

Pick the language's standard, boring toolchain. Confirm the choice in the plan.

| Ecosystem | Package manager | Format + lint | Types | Tests |
|---|---|---|---|---|
| TypeScript / JS / React / React Native | pnpm | Biome | `tsc --noEmit`, `strict: true` | Vitest (Jest only where the platform requires it, e.g. React Native preset) |
| Kotlin / Android | Gradle (Kotlin DSL, version catalog) | ktlint or Spotless + detekt | compiler | JUnit 5 + kotlinx-coroutines-test |
| Python | uv | Ruff | mypy or pyright strict | pytest |
| Go | go modules | gofmt + golangci-lint | compiler | `go test` |
| Rust | cargo | rustfmt + clippy | compiler | `cargo test` |
| Other | the community default | the community default | | |

Structure (details in `craft:architect` and its reference):
- Small project: plain feature folders.
- Frontend web or React Native that will grow: Feature-Sliced Design, starting with only `app`, `pages` and `shared`.
- Backend: feature modules with an `index.ts` public API each; ports and adapters only around real external I/O.
- Android / Kotlin: a package or module per feature with `ui` and `data`.
- Keep framework code at the edges and domain logic in plain functions or classes with no framework imports.
- Split only when a second real use appears.
- From medium size up, add the boundary check for the stack (dependency-cruiser, Konsist, import-linter…) in the first tooling commit, so the structure is enforced from day one.

Setup in this order:
1. Init with the package manager, add formatter, linter, type checker and test runner with near-default config.
2. Add scripts or tasks named `lint`, `typecheck`, `test`, `format` so the verify hook and humans use the same commands.
3. Add `.editorconfig` and a `.gitignore` for the stack.
4. Write the conventions file named in the craft repo context (including an `## Architecture` section), then run `node "${CLAUDE_PLUGIN_ROOT}/hooks/repo.mjs" mark`.
5. First commit: tooling only. Then features.
