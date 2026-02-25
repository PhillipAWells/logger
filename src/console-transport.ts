import type { ILogEntry, ILoggerConfig, ITransport } from './types.js';
import { formatForJson } from './json-formatter.js';

const NANOSECONDS_TO_MILLISECONDS = 1000000;

/**
 * ConsoleTransport outputs log entries to the console with ANSI color formatting.
 * Supports both text and JSON output formats.
 */
export class ConsoleTransport implements ITransport {
	private readonly config: ILoggerConfig;

	/**
	 * Creates a new ConsoleTransport instance.
	 * @param config - Logger configuration object
	 */
	constructor(config: ILoggerConfig) {
		this.config = config;
	}

	/**
	 * Writes a log entry to the console.
	 * @param entry - The log entry to write
	 */
	public write(entry: ILogEntry): void {
		const format = this.config.format ?? 'text';

		if (format === 'json') {
			console.log(formatForJson(entry));
		} else {
			this.writeTextFormat(entry);
		}
	}

	private writeTextFormat(entry: ILogEntry): void {
		// Convert nanosecond timestamp string back to milliseconds for Date constructor
		const timestampMs = Number(entry.timestamp) / NANOSECONDS_TO_MILLISECONDS;
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

		console.log(`${timestamp} ${coloredLevel} [${entry.service}]${traceString} ${entry.message}${metadata}`);
	}

	private colorizeLevel(level: string): string {
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
