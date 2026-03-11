import type { Writable } from 'node:stream';

import type { ILogEntry, ILoggerConfig, ITransport } from './types.js';
import { formatForJson } from './json-formatter.js';

// 1 millisecond = 1,000,000 nanoseconds
const NS_PER_MS = 1_000_000n;

/**
 * ConsoleTransport outputs log entries to the console with ANSI color formatting.
 * Supports both text and JSON output formats.
 */
export class ConsoleTransport implements ITransport {
	private readonly config: ILoggerConfig;
	private readonly stream: Writable;

	/**
	 * Creates a new ConsoleTransport instance.
	 * @param config - Logger configuration object
	 * @param stream - Writable stream to output to (defaults to process.stdout)
	 */
	constructor(config: ILoggerConfig, stream: Writable = process.stdout) {
		this.config = config;
		this.stream = stream;
	}

	/**
	 * Writes a log entry to the stream.
	 * @param entry - The log entry to write
	 */
	public write(entry: ILogEntry): void {
		const format = this.config.format ?? 'text';

		if (format === 'json') {
			this.stream.write(formatForJson(entry) + '\n');
		} else {
			this.writeTextFormat(entry);
		}
	}

	private writeTextFormat(entry: ILogEntry): void {
		// Convert nanosecond timestamp string back to milliseconds for Date constructor
		const timestampMs = Number(BigInt(entry.timestamp) / NS_PER_MS);
		const timestamp = new Date(timestampMs).toISOString();
		const level = entry.level.toUpperCase();
		const coloredLevel = this.colorizeLevel(level);
		const metadata = entry.metadata && Object.keys(entry.metadata).length > 0
			? ` ${JSON.stringify(entry.metadata)}`
			: '';

		// Build trace info string if any trace fields are present
		const traceInfo: string[] = [];
		if (entry.traceId) {
			traceInfo.push(`traceId=${entry.traceId}`);
		}
		if (entry.spanId) {
			traceInfo.push(`spanId=${entry.spanId}`);
		}
		if (entry.correlationId) {
			traceInfo.push(`correlationId=${entry.correlationId}`);
		}
		const traceString = traceInfo.length > 0 ? ` [${traceInfo.join(', ')}]` : '';

		this.stream.write(`${timestamp} ${coloredLevel} [${entry.service}]${traceString} ${entry.message}${metadata}\n`);
	}

	private colorizeLevel(level: string): string {
		// Only apply ANSI color codes when writing to an interactive terminal
		if (!(this.stream as { isTTY?: boolean }).isTTY) {
			return level;
		}
		switch (level) {
			case 'DEBUG':
				return `\x1b[36m${level}\x1b[0m`; // Cyan
			case 'INFO':
				return `\x1b[32m${level}\x1b[0m`; // Green
			case 'WARN':
				return `\x1b[33m${level}\x1b[0m`; // Yellow
			case 'ERROR':
				return `\x1b[31m${level}\x1b[0m`; // Red
			case 'FATAL':
				return `\x1b[35m${level}\x1b[0m`; // Magenta
			default:
				return level;
		}
	}
}
