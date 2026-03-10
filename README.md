# @pawells/logger

[![npm](https://img.shields.io/npm/v/@pawells/logger)](https://www.npmjs.com/package/@pawells/logger)
[![GitHub Release](https://img.shields.io/github/v/release/PhillipAWells/logger)](https://github.com/PhillipAWells/logger/releases)
[![CI](https://github.com/PhillipAWells/logger/actions/workflows/ci.yml/badge.svg)](https://github.com/PhillipAWells/logger/actions/workflows/ci.yml)
[![Node](https://img.shields.io/badge/node-%3E%3D22-brightgreen)](https://nodejs.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

Structured logging library for TypeScript/Node.js with ESM, no runtime dependencies, and support for multiple transports and formatters for structured logging and log aggregation.

## Features

- Structured logging with configurable log levels (DEBUG, INFO, WARN, ERROR, FATAL, SILENT)
- Multiple built-in transports: Console (with ANSI colors)
- Pluggable transport system for custom integrations
- JSON formatter for log aggregation platforms
- Nanosecond-precision timestamps
- Support for metadata and tracing fields (traceId, spanId, correlationId)
- Full TypeScript support with strict typing
- ESM-only, no runtime dependencies
- Targets ES2022, runs on Node.js >= 22.0.0

## Installation

```bash
npm install @pawells/logger
# or
yarn add @pawells/logger
```

## Quick Start

```typescript
import { Logger, ConsoleTransport, LogLevel } from '@pawells/logger';

// Create a logger instance
const logger = new Logger({
  service: 'my-app',
  level: LogLevel.DEBUG,
  transport: new ConsoleTransport(),
});

// Log messages at different levels
await logger.debug('Debug information', { userId: 123 });
await logger.info('Application started');
await logger.warn('Memory usage is high', { usage: 85 });
await logger.error('Request failed', { statusCode: 500 });
await logger.fatal('System critical error', { errno: 'EACCES' });
```

## API Reference

### Logger Class

Main logging interface with methods for each log level.

#### Constructor

```typescript
constructor(config: ILoggerConfig)
```

**ILoggerConfig**:
- `service: string` — Required service name for the logger
- `level?: LogLevel` — Minimum log level to output (defaults to INFO)
- `format?: 'json' | 'text'` — Output format (defaults to 'text')
- `transport?: ITransport` — Transport to send logs to (defaults to ConsoleTransport)

#### Methods

```typescript
async debug(message: string, metadata?: Record<string, unknown>): Promise<void>
async info(message: string, metadata?: Record<string, unknown>): Promise<void>
async warn(message: string, metadata?: Record<string, unknown>): Promise<void>
async error(message: string, metadata?: Record<string, unknown>): Promise<void>
async fatal(message: string, metadata?: Record<string, unknown>): Promise<void>
```

### LogLevel Enum

```typescript
enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
  SILENT = 'silent', // suppresses all output when set as the logger level
}
```

### ConsoleTransport

Outputs log entries to the console with ANSI color formatting.

```typescript
import { ConsoleTransport, LogLevel } from '@pawells/logger';

const transport = new ConsoleTransport({ service: 'my-app', level: LogLevel.INFO });
const logger = new Logger({
  service: 'my-app',
  level: LogLevel.INFO,
  transport: transport,
});
```

### formatForJson()

Formats log entries as structured JSON compatible with log aggregation platforms.

```typescript
import { formatForJson, ILogEntry, LogLevel } from '@pawells/logger';

const logEntry: ILogEntry = {
  timestamp: Date.now().toString(),
  level: LogLevel.INFO,
  service: 'my-app',
  message: 'User login successful',
  metadata: { userId: '42' },
};

const jsonOutput = formatForJson(logEntry);
// Output: {"timestamp":"1705257983000000000","level":"info","service":"my-app","message":"User login successful","metadata":{"userId":"42"}}
```

### ITransport Interface

Implement this interface to create custom transports.

```typescript
interface ITransport {
  write(entry: ILogEntry): void | Promise<void>;
}
```

**ILogEntry**:
- `timestamp: string` — Nanosecond-precision timestamp as string
- `level: LogLevel` — Log level
- `service: string` — Service name
- `message: string` — Log message
- `metadata?: Record<string, unknown>` — Contextual metadata
- `traceId?: string` — Distributed trace ID
- `spanId?: string` — Distributed span ID
- `correlationId?: string` — Correlation ID for request tracking

## Custom Transport Example

Create a custom transport to send logs to an external service:

```typescript
import { Logger, ITransport, ILogEntry, LogLevel } from '@pawells/logger';

class FileTransport implements ITransport {
  constructor(private filePath: string) {}

  async write(entry: ILogEntry): Promise<void> {
    const line = `[${entry.level}] ${entry.message}\n`;
    // Write to file (implementation varies by use case)
    await appendToFile(this.filePath, line);
  }
}

const logger = new Logger({
  service: 'my-app',
  level: LogLevel.INFO,
  transport: new FileTransport('./logs/app.log'),
});
```

## Log Aggregation Integration

For log aggregation with external platforms:

```typescript
import { Logger, ITransport, ILogEntry, formatForJson, LogLevel } from '@pawells/logger';

class AggregationTransport implements ITransport {
  constructor(private endpoint: string) {}

  async write(entry: ILogEntry): Promise<void> {
    const jsonOutput = formatForJson(entry);
    await fetch(this.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: jsonOutput,
    });
  }
}

const logger = new Logger({
  service: 'my-app',
  level: LogLevel.DEBUG,
  transport: new AggregationTransport('https://aggregation.example.com/api/v1/push'),
});
```

## Testing

The package ships mock transport factories for use in unit tests. Import from the subpath that matches your test framework.

### Vitest

```typescript
import { createMockTransport } from '@pawells/logger/testing/vitest';
import { Logger, LogLevel } from '@pawells/logger';

const transport = createMockTransport();
const logger = new Logger({ service: 'my-app', level: LogLevel.DEBUG, transport });

await logger.info('hello');

expect(transport.write).toHaveBeenCalledOnce();
expect(transport.write.mock.calls[0][0].message).toBe('hello');
```

### Jest

```typescript
import { createMockTransport } from '@pawells/logger/testing/jest';
import { Logger, LogLevel } from '@pawells/logger';

const transport = createMockTransport();
const logger = new Logger({ service: 'my-app', level: LogLevel.DEBUG, transport });

await logger.info('hello');

expect(transport.write).toHaveBeenCalledTimes(1);
expect(transport.write.mock.calls[0][0].message).toBe('hello');
```

`transport.write` is a typed spy (`vi.fn()` / `jest.fn()`) whose argument is `ILogEntry`, so all standard mock assertion APIs are available.

## TypeScript Support

Full TypeScript support with strict typing. All types are exported for custom implementations:

```typescript
import {
  Logger,
  LogLevel,
  ILogEntry,
  ILoggerConfig,
  ITransport,
  ConsoleTransport,
  formatForJson,
} from '@pawells/logger';
```

## Development

```bash
yarn install        # Install dependencies
yarn build          # Compile TypeScript (tsconfig.build.json) → ./build/
yarn dev            # Build + run
yarn watch          # Watch mode
yarn typecheck      # Type check without building
yarn lint           # ESLint
yarn lint:fix       # ESLint with auto-fix
yarn test           # Run tests
yarn test:ui        # Interactive Vitest UI
yarn test:coverage  # Tests with coverage report
```

## Requirements

- Node.js >= 22.0.0

## License

MIT — See [LICENSE](./LICENSE) for details.
