import { formatForJson } from './json-formatter.js';
import type { ILogEntry } from './types.js';
import { LogLevel } from './types.js';

describe('formatForJson', () => {
	it('should format a basic log entry correctly', () => {
		const entry: ILogEntry = {
			timestamp: '1705257983000000000',
			level: LogLevel.INFO,
			service: 'test-service',
			message: 'Test message',
		};

		const result = formatForJson(entry);
		const parsed = JSON.parse(result);

		expect(parsed.timestamp).toBe('1705257983000000000');
		expect(parsed.level).toBe('info');
		expect(parsed.service).toBe('test-service');
		expect(parsed.message).toBe('Test message');
		expect(parsed.metadata).toBeUndefined();
	});

	it('should include metadata when provided', () => {
		const entry: ILogEntry = {
			timestamp: '1705257983000000000',
			level: LogLevel.ERROR,
			service: 'test-service',
			message: 'Error occurred',
			metadata: { userId: '123', errorCode: 'ECONNREFUSED' },
		};

		const result = formatForJson(entry);
		const parsed = JSON.parse(result);

		expect(parsed.metadata).toEqual({ userId: '123', errorCode: 'ECONNREFUSED' });
	});

	it('should handle special characters in message', () => {
		const entry: ILogEntry = {
			timestamp: '1705257983000000000',
			level: LogLevel.WARN,
			service: 'test-service',
			message: 'Message with "quotes" and \'apostrophes\' and \n newlines',
		};

		const result = formatForJson(entry);
		const parsed = JSON.parse(result);

		expect(parsed.message).toBe('Message with "quotes" and \'apostrophes\' and \n newlines');
	});

	it('should handle circular references gracefully', () => {
		const circular: any = { prop: 'value' };
		circular.self = circular;

		const entry: ILogEntry = {
			timestamp: '1705257983000000000',
			level: LogLevel.DEBUG,
			service: 'test-service',
			message: 'Circular reference test',
			metadata: circular,
		};

		// Should not throw
		const result = formatForJson(entry);
		expect(() => JSON.parse(result)).not.toThrow();
		const parsed = JSON.parse(result);
		expect(parsed.metadata.self).toBe('[Circular]');
	});

	it('should not mark shared (non-circular) references as circular', () => {
		const shared = { value: 42 };
		const entry: ILogEntry = {
			timestamp: '1705257983000000000',
			level: LogLevel.DEBUG,
			service: 'test-service',
			message: 'Shared reference test',
			metadata: { a: shared, b: shared },
		};

		const result = formatForJson(entry);
		expect(() => JSON.parse(result)).not.toThrow();
		const parsed = JSON.parse(result);
		expect(parsed.metadata.a).toEqual({ value: 42 });
		expect(parsed.metadata.b).toEqual({ value: 42 });
	});

	it('should return valid JSON on all inputs', () => {
		const entries: ILogEntry[] = [
			{
				timestamp: '1705257983000000000',
				level: LogLevel.INFO,
				service: 'service',
				message: 'normal message',
			},
			{
				timestamp: '1705257983000000000',
				level: LogLevel.ERROR,
				service: 'service',
				message: 'message with metadata',
				metadata: { key: 'value' },
			},
		];

		entries.forEach(entry => {
			const result = formatForJson(entry);
			expect(() => JSON.parse(result)).not.toThrow();
		});
	});

	it('should include traceId when provided', () => {
		const entry: ILogEntry = {
			timestamp: '1705257983000000000',
			level: LogLevel.INFO,
			service: 'test-service',
			message: 'Traced message',
			traceId: 'trace-123-abc',
		};

		const result = formatForJson(entry);
		const parsed = JSON.parse(result);

		expect(parsed.traceId).toBe('trace-123-abc');
		expect(parsed.timestamp).toBe('1705257983000000000');
		expect(parsed.level).toBe('info');
	});

	it('should include spanId when provided', () => {
		const entry: ILogEntry = {
			timestamp: '1705257983000000000',
			level: LogLevel.INFO,
			service: 'test-service',
			message: 'Spanned message',
			spanId: 'span-456-def',
		};

		const result = formatForJson(entry);
		const parsed = JSON.parse(result);

		expect(parsed.spanId).toBe('span-456-def');
	});

	it('should include correlationId when provided', () => {
		const entry: ILogEntry = {
			timestamp: '1705257983000000000',
			level: LogLevel.INFO,
			service: 'test-service',
			message: 'Correlated message',
			correlationId: 'corr-789-ghi',
		};

		const result = formatForJson(entry);
		const parsed = JSON.parse(result);

		expect(parsed.correlationId).toBe('corr-789-ghi');
	});

	it('should include all trace fields when all provided', () => {
		const entry: ILogEntry = {
			timestamp: '1705257983000000000',
			level: LogLevel.INFO,
			service: 'test-service',
			message: 'Fully traced message',
			traceId: 'trace-123-abc',
			spanId: 'span-456-def',
			correlationId: 'corr-789-ghi',
		};

		const result = formatForJson(entry);
		const parsed = JSON.parse(result);

		expect(parsed.traceId).toBe('trace-123-abc');
		expect(parsed.spanId).toBe('span-456-def');
		expect(parsed.correlationId).toBe('corr-789-ghi');
		expect(parsed.level).toBe('info');
		expect(parsed.service).toBe('test-service');
		expect(parsed.message).toBe('Fully traced message');
	});

	it('should not include trace fields when not provided', () => {
		const entry: ILogEntry = {
			timestamp: '1705257983000000000',
			level: LogLevel.INFO,
			service: 'test-service',
			message: 'No trace fields',
		};

		const result = formatForJson(entry);
		const parsed = JSON.parse(result);

		expect(parsed.traceId).toBeUndefined();
		expect(parsed.spanId).toBeUndefined();
		expect(parsed.correlationId).toBeUndefined();
		expect(parsed.timestamp).toBe('1705257983000000000');
	});

	it('should return fallback JSON when serialization throws', () => {
		const throwingMetadata: Record<string, unknown> = {};
		Object.defineProperty(throwingMetadata, 'bad', {
			enumerable: true,
			get() {
				throw new Error('toJSON exploded');
			},
		});

		const entry: ILogEntry = {
			timestamp: '1705257983000000000',
			level: LogLevel.ERROR,
			service: 'test-service',
			message: 'boom',
			metadata: throwingMetadata,
		};

		const result = formatForJson(entry);
		expect(() => JSON.parse(result)).not.toThrow();
		const parsed = JSON.parse(result);
		expect(parsed.timestamp).toBe('1705257983000000000');
		expect(parsed.level).toBe('error');
		expect(parsed.service).toBe('test-service');
		expect(parsed.metadata.errorType).toBe('Error');
	});

	it('should return fallback JSON with typeof when a non-Error value is thrown', () => {
		const throwingMetadata: Record<string, unknown> = {};
		Object.defineProperty(throwingMetadata, 'bad', {
			enumerable: true,
			get() {
				// eslint-disable-next-line no-throw-literal
				throw 'string error';
			},
		});

		const entry: ILogEntry = {
			timestamp: '1705257983000000000',
			level: LogLevel.ERROR,
			service: 'test-service',
			message: 'boom',
			metadata: throwingMetadata,
		};

		const result = formatForJson(entry);
		expect(() => JSON.parse(result)).not.toThrow();
		const parsed = JSON.parse(result);
		expect(parsed.metadata.errorType).toBe('string');
	});
});
