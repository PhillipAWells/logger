import type { ILogEntry, ILoggerConfig, ITransport } from './types.ts';
import { LogLevel } from './types.ts';
import { ConsoleTransport } from './console-transport.ts';

const NANOSECONDS_PER_MILLISECOND = 1000000;

export class Logger {
	private readonly config: ILoggerConfig;

	private readonly transport: ITransport;

	private static readonly LEVELS = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR, LogLevel.FATAL];

	constructor(config: ILoggerConfig) {
		this.config = {
			level: LogLevel.INFO,
			format: 'text',
			...config,
		};
		this.transport = this.config.transport ?? new ConsoleTransport(this.config);
	}

	public debug(message: string, metadata?: Record<string, unknown>): void {
		this.log(LogLevel.DEBUG, message, metadata);
	}

	public info(message: string, metadata?: Record<string, unknown>): void {
		this.log(LogLevel.INFO, message, metadata);
	}

	public warn(message: string, metadata?: Record<string, unknown>): void {
		this.log(LogLevel.WARN, message, metadata);
	}

	public error(message: string, metadata?: Record<string, unknown>): void {
		this.log(LogLevel.ERROR, message, metadata);
	}

	public fatal(message: string, metadata?: Record<string, unknown>): void {
		this.log(LogLevel.FATAL, message, metadata);
	}

	private log(level: LogLevel, message: string, metadata?: Record<string, unknown>): void {
		if (!this.shouldLog(level)) {
			return;
		}

		const entry: ILogEntry = {
			timestamp: (Date.now() * NANOSECONDS_PER_MILLISECOND).toString(), // Unix epoch nanoseconds as string
			level,
			service: this.config.service,
			message,
			...(metadata && { metadata }),
		};

		this.transport.write(entry);
	}

	private shouldLog(level: LogLevel): boolean {
		const currentLevel = this.config.level ?? LogLevel.INFO;
		const currentLevelIndex = Logger.LEVELS.indexOf(currentLevel);
		const messageLevelIndex = Logger.LEVELS.indexOf(level);
		return messageLevelIndex >= currentLevelIndex;
	}
}
