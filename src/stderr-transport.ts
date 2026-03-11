import type { ILoggerConfig } from './types.js';
import { ConsoleTransport } from './console-transport.js';

/**
 * StderrTransport outputs log entries to stderr instead of stdout.
 * Useful for servers that reserve stdout for structured protocol output
 * (MCP, JSON-RPC, LSP, etc.).
 *
 * Identical to ConsoleTransport in all other respects — same text/JSON
 * formatting and ANSI colour support.
 */
export class StderrTransport extends ConsoleTransport {
	constructor(config: ILoggerConfig) {
		super(config, process.stderr);
	}
}
