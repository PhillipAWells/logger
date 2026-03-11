import type { ILogEntry, ILoggerConfig, ITransport } from './types.js';
import { LogLevel } from './types.js';
import { ConsoleTransport } from './console-transport.js';
 
// 1 millisecond = 1,000,000 nanoseconds
const NS_PER_MS = 1_000_000n;

/**
 * Logger class providing structured logging with configurable levels and transports.
 * Supports multiple log levels (DEBUG, INFO, WARN, ERROR, FATAL) and pluggable transports
 * for custom delivery mechanisms.
 */
export class Logger {
	private readonly config: ILoggerConfig;

	private readonly transport: ITransport;

	private static readonly LEVELS = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR, LogLevel.FATAL, LogLevel.SILENT];

	// eslint-disable-next-line no-magic-numbers
	private static readonly MAX_SERVICE_NAME_LENGTH = 256;

	/**
	 * Creates a new Logger instance.
	 * @param config - Configuration object with service name, optional level, format, and transport
	 * @throws Error if service name is not provided, is empty, or exceeds 256 characters
	 */
	constructor(config: ILoggerConfig) {
		if (!config.service?.trim()) {
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
	 * @param metadata - Optional metadata object to include with the log entry
	 */
	// eslint-disable-next-line require-await
	public async debug(message: string, metadata?: Record<string, unknown>): Promise<void> {
		return this.log(LogLevel.DEBUG, message, metadata);
	}

	/**
	 * Logs an info-level message.
	 * @param message - The message to log
	 * @param metadata - Optional metadata object to include with the log entry
	 */
	// eslint-disable-next-line require-await
	public async info(message: string, metadata?: Record<string, unknown>): Promise<void> {
		return this.log(LogLevel.INFO, message, metadata);
	}

	/**
	 * Logs a warn-level message.
	 * @param message - The message to log
	 * @param metadata - Optional metadata object to include with the log entry
	 */
	// eslint-disable-next-line require-await
	public async warn(message: string, metadata?: Record<string, unknown>): Promise<void> {
		return this.log(LogLevel.WARN, message, metadata);
	}

	/**
	 * Logs an error-level message.
	 * @param message - The message to log
	 * @param metadata - Optional metadata object to include with the log entry
	 */
	// eslint-disable-next-line require-await
	public async error(message: string, metadata?: Record<string, unknown>): Promise<void> {
		return this.log(LogLevel.ERROR, message, metadata);
	}

	/**
	 * Logs a fatal-level message.
	 * @param message - The message to log
	 * @param metadata - Optional metadata object to include with the log entry
	 */
	// eslint-disable-next-line require-await
	public async fatal(message: string, metadata?: Record<string, unknown>): Promise<void> {
		return this.log(LogLevel.FATAL, message, metadata);
	}

	private async log(level: LogLevel, message: string, metadata?: Record<string, unknown>): Promise<void> {
		if (!this.shouldLog(level)) {
			return;
		}

		const entry: ILogEntry = {
			timestamp: (BigInt(Date.now()) * NS_PER_MS).toString(), // Unix epoch nanoseconds as string using BigInt
			level,
			service: this.config.service,
			message,
			...(metadata && { metadata }),
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
