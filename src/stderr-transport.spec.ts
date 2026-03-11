import { vi } from 'vitest';
import { LogLevel } from './types.js';
import { StderrTransport } from './stderr-transport.js';

const mockStderrWrite = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);

describe('StderrTransport', () => {
	beforeEach(() => {
		mockStderrWrite.mockClear();
	});

	afterAll(() => {
		mockStderrWrite.mockRestore();
	});

	it('should write log entries to stderr', () => {
		const transport = new StderrTransport({ service: 'test-service' });

		transport.write({
			timestamp: '1705257983000000000',
			level: LogLevel.INFO,
			service: 'test-service',
			message: 'Hello from stderr',
		});

		expect(mockStderrWrite).toHaveBeenCalledTimes(1);
		const output = String(mockStderrWrite.mock.calls[0]?.[0]);
		expect(output).toContain('Hello from stderr');
		expect(output).toContain('[test-service]');
	});

	it('should not write to stdout', () => {
		const mockStdoutWrite = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);

		try {
			const transport = new StderrTransport({ service: 'test-service' });

			transport.write({
				timestamp: '1705257983000000000',
				level: LogLevel.WARN,
				service: 'test-service',
				message: 'stderr only',
			});

			expect(mockStdoutWrite).not.toHaveBeenCalled();
			expect(mockStderrWrite).toHaveBeenCalledTimes(1);
		} finally {
			mockStdoutWrite.mockRestore();
		}
	});

	it('should support text format', () => {
		const transport = new StderrTransport({ service: 'test-service', format: 'text' });

		transport.write({
			timestamp: '1705257983000000000',
			level: LogLevel.ERROR,
			service: 'test-service',
			message: 'text format error',
		});

		const output = String(mockStderrWrite.mock.calls[0]?.[0]);
		expect(output).toContain('ERROR');
		expect(output).toContain('[test-service]');
		expect(output).toContain('text format error');
	});

	it('should support JSON format', () => {
		const transport = new StderrTransport({ service: 'test-service', format: 'json' });

		transport.write({
			timestamp: '1705257983000000000',
			level: LogLevel.INFO,
			service: 'test-service',
			message: 'json format message',
			metadata: { key: 'value' },
		});

		const output = String(mockStderrWrite.mock.calls[0]?.[0]).trim();
		const parsed = JSON.parse(output);
		expect(parsed.level).toBe('info');
		expect(parsed.service).toBe('test-service');
		expect(parsed.message).toBe('json format message');
		expect(parsed.metadata).toEqual({ key: 'value' });
	});

	it('should include all log levels', () => {
		const transport = new StderrTransport({ service: 'svc' });
		const levels = [
			{ level: LogLevel.DEBUG, label: 'DEBUG' },
			{ level: LogLevel.INFO, label: 'INFO' },
			{ level: LogLevel.WARN, label: 'WARN' },
			{ level: LogLevel.ERROR, label: 'ERROR' },
			{ level: LogLevel.FATAL, label: 'FATAL' },
		];

		for (const { level, label } of levels) {
			mockStderrWrite.mockClear();
			transport.write({ timestamp: '1705257983000000000', level, service: 'svc', message: 'msg' });
			expect(String(mockStderrWrite.mock.calls[0]?.[0])).toContain(label);
		}
	});
});
