import type { ILogEntry, ILoggerConfig, ITransport } from './types.js';
import { LogLevel } from './types.js';
import { ConsoleTransport } from './console-transport.js';
import { NS_PER_MS } from './constants.js';
import { EnumValues, IS_BLANK_STRING } from '@pawells/typescript-common';

/**
 * Logger class providing structured logging with configurable levels and transports.
 * Supports multiple log levels (DEBUG, INFO, WARN, ERROR, FATAL) and pluggable transports
 * for custom delivery mechanisms.
 */
export class Logger {
	private readonly config: ILoggerConfig;

	private readonly transport: ITransport;

	private static readonly LEVELS = EnumValues(LogLevel);

	// eslint-disable-next-line no-magic-numbers
	private static readonly MAX_SERVICE_NAME_LENGTH = 256;

	/**
	 * Creates a new Logger instance.
	 * @param config - Configuration object with service name, optional level, format, and transport
	 * @throws Error if service name is not provided, is empty, or exceeds 256 characters
	 */
	constructor(config: ILoggerConfig) {
		if (!config.service || IS_BLANK_STRING(config.service)) {
			throw new Error('Logger requires a non-empty service name');
		}
		if (config.service.length > Logger.MAX_SERVICE_NAME_LENGTH) {
			throw new Error(`Logger service name must not exceed ${Logger.MAX_SERVICE_NAME_LENGTH} characters`);
		}

		this.config = {
			level: LogLevel.INFO,
			format: 'text',
			...config,
		};
		this.transport = this.config.transport ?? new ConsoleTransport(this.config);
	}

	/**
	 * Logs a debug-level message.
	 * @param message - The message to log
	 * @param metadata - Optional metadata to include with the log entry. Errors are normalised to `{ error, name, stack }`, primitives to `{ value }`, plain objects passed through, null/undefined omitted.
	 */
	public debug(message: string, metadata?: unknown): Promise<void> {
		return this.log(LogLevel.DEBUG, message, metadata);
	}

	/**
	 * Logs an info-level message.
	 * @param message - The message to log
	 * @param metadata - Optional metadata to include with the log entry. Errors are normalised to `{ error, name, stack }`, primitives to `{ value }`, plain objects passed through, null/undefined omitted.
	 */
	public info(message: string, metadata?: unknown): Promise<void> {
		return this.log(LogLevel.INFO, message, metadata);
	}

	/**
	 * Logs a warn-level message.
	 * @param message - The message to log
	 * @param metadata - Optional metadata to include with the log entry. Errors are normalised to `{ error, name, stack }`, primitives to `{ value }`, plain objects passed through, null/undefined omitted.
	 */
	public warn(message: string, metadata?: unknown): Promise<void> {
		return this.log(LogLevel.WARN, message, metadata);
	}

	/**
	 * Logs an error-level message.
	 * @param message - The message to log
	 * @param metadata - Optional metadata to include with the log entry. Errors are normalised to `{ error, name, stack }`, primitives to `{ value }`, plain objects passed through, null/undefined omitted.
	 */
	public error(message: string, metadata?: unknown): Promise<void> {
		return this.log(LogLevel.ERROR, message, metadata);
	}

	/**
	 * Logs a fatal-level message.
	 * @param message - The message to log
	 * @param metadata - Optional metadata to include with the log entry. Errors are normalised to `{ error, name, stack }`, primitives to `{ value }`, plain objects passed through, null/undefined omitted.
	 */
	public fatal(message: string, metadata?: unknown): Promise<void> {
		return this.log(LogLevel.FATAL, message, metadata);
	}

	private static normalizeMetadata(metadata: unknown): Record<string, unknown> | undefined {
		if (metadata === null || metadata === undefined) {
			return undefined;
		}
		if (metadata instanceof Error) {
			return { error: metadata.message, name: metadata.name, stack: metadata.stack };
		}
		if (typeof metadata === 'object' && !Array.isArray(metadata)) {
			const obj = metadata as Record<string, unknown>;
			if (Object.keys(obj).length === 0) {
				return undefined;
			}
			return obj;
		}
		return { value: metadata };
	}

	private async log(level: LogLevel, message: string, metadata?: unknown): Promise<void> {
		if (!this.shouldLog(level)) {
			return;
		}

		const normalizedMetadata = Logger.normalizeMetadata(metadata);
		const entry: ILogEntry = {
			timestamp: (BigInt(Date.now()) * NS_PER_MS).toString(), // Unix epoch nanoseconds as string using BigInt
			level,
			service: this.config.service,
			message,
			...(normalizedMetadata && { metadata: normalizedMetadata }),
		};

		try {
			await this.transport.write(entry);
		} catch (error) {
			console.error('Error writing log entry to transport:', error);
		}
	}

	private shouldLog(level: LogLevel): boolean {
		const currentLevel = this.config.level ?? LogLevel.INFO;
		const currentLevelIndex = Logger.LEVELS.indexOf(currentLevel);
		const messageLevelIndex = Logger.LEVELS.indexOf(level);
		return messageLevelIndex >= currentLevelIndex;
	}
}
