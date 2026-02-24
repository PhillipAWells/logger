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
		expect(parsed.metadata).toEqual({});
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
});
