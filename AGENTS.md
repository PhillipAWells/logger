## Project Overview

`@pawells/logger` is a structured logging library for TypeScript/Node.js published to npm. It targets ES2022, is distributed as ESM, and has no runtime dependencies. The library provides configurable logging with support for multiple transports and formatters, including JSON formatting for log aggregation platforms. It exports from a primary entry point (`src/index.ts`) and testing subpath entry points (`src/testing/vitest.ts`, `src/testing/jest.ts`).

## Package Manager

Project uses **Yarn Berry** (`yarn@4.12.0`) managed via corepack. Before working:

```bash
corepack enable       # Enable corepack to use the pinned yarn version
```

Configuration is in `.yarnrc.yml`. All dependencies are managed through Yarn:

```bash
yarn install          # Install dependencies with lockfile validation
yarn add <package>    # Add a package
yarn remove <package> # Remove a package
```

## Commands

```bash
yarn build            # Compile TypeScript → ./build/
yarn dev              # Build and run (tsc && node build/index.js)
yarn watch            # TypeScript watch mode
yarn typecheck        # Type check without emitting
yarn lint             # ESLint src/
yarn lint:fix         # ESLint with auto-fix
yarn test             # Run Vitest tests
yarn test:ui          # Open interactive Vitest UI in a browser
yarn test:coverage    # Run tests with coverage report (80% threshold)
yarn start            # Run built output
```

To run a single test file: `yarn vitest run src/path/to/file.spec.ts`

## Architecture

All source lives under `src/` and is compiled to `./build/` by `tsc`.

**Entry point** (`src/index.ts`): The single public export surface for the library. All logging utilities, transports, formatters, and types intended for consumers must be re-exported from this file.

### Core modules

| File | Purpose |
|------|---------|
| `src/logger.ts` | Main `Logger` class with logging methods (debug, info, warn, error, fatal) |
| `src/types.ts` | Type definitions: `ILogEntry`, `ILoggerConfig`, `ITransport`, `IWritableStream`, `LogLevel` enum |
| `src/console-transport.ts` | `ConsoleTransport` — writes to stdout with ANSI color support |
| `src/stderr-transport.ts` | `StderrTransport` — extends `ConsoleTransport`, writes to stderr |
| `src/json-formatter.ts` | `formatForJson()` function for structured JSON formatting |
| `src/constants.ts` | Shared constants (e.g. `NS_PER_MS` BigInt for timestamp conversion) |
| `src/index.ts` | Public API re-exports |
| `src/logger.spec.ts` | Logger tests |
| `src/json-formatter.spec.ts` | Formatter tests |
| `src/testing/vitest.ts` | `createMockTransport()` factory using `vi.fn()` — exported via `@pawells/logger/testing/vitest` |
| `src/testing/jest.ts` | `createMockTransport()` factory using `jest.fn()` — exported via `@pawells/logger/testing/jest` |

### Transport pattern

The library uses a pluggable transport system via the `ITransport` interface. Transports handle delivery of log entries to their destinations (console, file, API, etc.). Custom transports must implement:

```typescript
interface ITransport {
  write(entry: ILogEntry): void | Promise<void>;
}
```

## Key Patterns

**Adding a new transport**: Implement the `ITransport` interface with a `write()` method, place in `src/`, and re-export from `src/index.ts`.

**Adding a new formatter**: Implement a formatting function that accepts `ILogEntry` and returns formatted output, place in `src/`, and re-export from `src/index.ts`.

**Logger configuration**: Instantiate the `Logger` class with an `ILoggerConfig` object specifying the minimum log level and transports to use.

**No runtime dependencies**: Keep `dependencies` empty in package.json. All tooling belongs in `devDependencies`. `vitest` and `@jest/globals` are declared as optional peer dependencies (with `peerDependenciesMeta.optional: true`) because they are only needed when consuming the testing subpath exports.

**Testing utilities**: `createMockTransport()` in `src/testing/vitest.ts` and `src/testing/jest.ts` return a `MockTransport` whose `write` method is a framework spy. Import from the matching subpath: `@pawells/logger/testing/vitest` or `@pawells/logger/testing/jest`.

**ESM only**: The package is `"type": "module"`. Use ESM import/export syntax throughout; avoid CommonJS patterns. Internal imports must use `.js` extensions.

## TypeScript Configuration

Project uses a 4-config split:

- **`tsconfig.json`** — Base/development configuration used by Vitest and editors. Includes all source files for full type checking and IDE support.
- **`tsconfig.build.json`** — Production build configuration that extends `tsconfig.json`, explicitly excludes test files (`src/**/*.spec.ts`), and is used only by the build script.
- **`tsconfig.test.json`** — Vitest test configuration.
- **`tsconfig.eslint.json`** — ESLint type-aware linting configuration.

Build command: `tsc --project tsconfig.build.json` (default in build script)

General configuration: Requires Node.js >= 22.0.0. Outputs to `./build/`, targets ES2022, module resolution `bundler`. Declaration files (`.d.ts`) and source maps are emitted alongside JS. Strict mode is fully enabled (`strict`, `noImplicitAny`, `strictNullChecks`, `strictFunctionTypes`).

## CI/CD

Two workflows under `.github/workflows/`:

**`ci.yml`** — triggered on push to `main`, PRs to `main`, and as a reusable `workflow_call`:
- `validate` job: typecheck → lint (Node 22)
- `test` job: runs on Node 22 and 24 matrix
- `build` job: depends on validate + test, compiles with `yarn build`

**`publish.yml`** — triggered on `v*` tag pushes:
- Calls `ci.yml` as a reusable workflow first
- Then `publish` job: build → `npm publish --provenance --access public` (Node 24) → create GitHub Release via `softprops/action-gh-release@v2`

## Development Container

A custom `.devcontainer/Dockerfile` is provided with:

- Non-root dev user for security
- Pre-configured Node.js environment
- Post-creation hook (`.devcontainer/scripts/postCreate.sh`) to set up the development environment

Use `devcontainer open` or your IDE's container integration to develop in the containerized environment.

## IMPORTANT

NEVER ADD CLAUDE CO-AUTHOR CREDITS OR "GENERATED WITH..." FOOTERS.

