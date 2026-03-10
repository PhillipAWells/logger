export enum LogLevel {
	DEBUG = 'debug',
	INFO = 'info',
	WARN = 'warn',
	ERROR = 'error',
	FATAL = 'fatal',
	SILENT = 'silent',
}

export interface ILogEntry {
	timestamp: string;
	level: LogLevel;
	service: string;
	message: string;
	metadata?: Record<string, unknown>;
	traceId?: string;
	spanId?: string;
	correlationId?: string;
}

export interface ILoggerConfig {
	service: string;
	level?: LogLevel;
	format?: 'json' | 'text';
	transport?: ITransport;
}

export interface ITransport {
	write(entry: ILogEntry): void | Promise<void>;
}
