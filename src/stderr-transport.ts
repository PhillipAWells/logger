import type { ILoggerConfig, IWritableStream } from './types.js';
import { ConsoleTransport } from './console-transport.js';

/* c8 ignore start */
const STDERR: IWritableStream = typeof process !== 'undefined' && process.stderr !== null && process.stderr !== undefined
	? process.stderr as IWritableStream
	: {
		write: (s: string): void => {
			console.error(s.replace(/\n$/, ''));
		},
	};
/* c8 ignore stop */

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
		super(config, STDERR);
	}
}
