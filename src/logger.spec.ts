/**
 * Test file for Logger class
 * ESLint rules disabled for test files:
 * - no-magic-numbers: Test data inherently uses literal numbers for assertions and test scenarios
 */

import { vi } from 'vitest';
import { Logger } from './logger.js';
import { LogLevel } from './types.js';

// Mock process.stdout.write to capture output
const mockStdoutWrite = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);

describe('Logger', () => {
	beforeEach(() => {
		mockStdoutWrite.mockClear();
	});

	afterAll(() => {
		mockStdoutWrite.mockRestore();
	});

	describe('constructor', () => {
		it('should create logger with default config', () => {
			const logger = new Logger({ service: 'test-service' });

			expect(logger).toBeDefined();
		});

		it('should use default level INFO when not specified', async () => {
			const logger = new Logger({ service: 'test-service' });

			// Debug should not be logged
			await logger.debug('debug message');
			expect(mockStdoutWrite).not.toHaveBeenCalled();

			// Info should be logged
			await logger.info('info message');
			expect(mockStdoutWrite).toHaveBeenCalled();
		});

		it('should throw error when service name is empty', () => {
			expect(() => new Logger({ service: '' })).toThrow('Logger requires a non-empty service name');
		});

		it('should throw error when service name is only whitespace', () => {
			expect(() => new Logger({ service: '   ' })).toThrow('Logger requires a non-empty service name');
		});

		it('should throw error when service name is not provided', () => {
			expect(() => new Logger({ service: undefined as any })).toThrow('Logger requires a non-empty service name');
		});

		it('should throw error when service name exceeds 256 characters', () => {
			expect(() => new Logger({ service: 'a'.repeat(257) })).toThrow(
				'Logger service name must not exceed 256 characters',
			);
		});

		it('should accept service name at the 256-character limit', () => {
			expect(() => new Logger({ service: 'a'.repeat(256) })).not.toThrow();
		});

		it('should default to INFO when level is explicitly undefined', async () => {
			const logger = new Logger({ service: 'test-service', level: undefined });

			await logger.debug('debug message');
			expect(mockStdoutWrite).not.toHaveBeenCalled();

			await logger.info('info message');
			expect(mockStdoutWrite).toHaveBeenCalled();
		});
	});

	describe('log level filtering', () => {
		it('should filter debug logs when level is info', async () => {
			const logger = new Logger({ service: 'test-service', level: LogLevel.INFO });

			await logger.debug('debug message');
			expect(mockStdoutWrite).not.toHaveBeenCalled();

			await logger.info('info message');
			expect(mockStdoutWrite).toHaveBeenCalledTimes(1);
		});

		it('should filter info and debug when level is warn', async () => {
			const logger = new Logger({ service: 'test-service', level: LogLevel.WARN });

			await logger.debug('debug message');
			await logger.info('info message');
			expect(mockStdoutWrite).not.toHaveBeenCalled();

			await logger.warn('warn message');
			expect(mockStdoutWrite).toHaveBeenCalledTimes(1);
		});

		it('should allow all levels when level is debug', async () => {
			const logger = new Logger({ service: 'test-service', level: LogLevel.DEBUG });

			await logger.debug('debug message');
			await logger.info('info message');
			await logger.warn('warn message');
			await logger.error('error message');

			expect(mockStdoutWrite).toHaveBeenCalledTimes(4);
		});

		it('should allow fatal level when level is error', async () => {
			const logger = new Logger({ service: 'test-service', level: LogLevel.ERROR });

			await logger.warn('warn message');
			await logger.error('error message');
			await logger.fatal('fatal message');

			expect(mockStdoutWrite).toHaveBeenCalledTimes(2);
		});

		it('should filter all logs when level is fatal', async () => {
			const logger = new Logger({ service: 'test-service', level: LogLevel.FATAL });

			await logger.debug('debug message');
			await logger.info('info message');
			await logger.warn('warn message');
			await logger.error('error message');
			expect(mockStdoutWrite).not.toHaveBeenCalled();

			await logger.fatal('fatal message');
			expect(mockStdoutWrite).toHaveBeenCalledTimes(1);
		});

		it('should suppress all output when level is silent', async () => {
			const logger = new Logger({ service: 'test-service', level: LogLevel.SILENT });

			await logger.debug('debug message');
			await logger.info('info message');
			await logger.warn('warn message');
			await logger.error('error message');
			await logger.fatal('fatal message');

			expect(mockStdoutWrite).not.toHaveBeenCalled();
		});
	});

	describe('log methods', () => {
		let logger: Logger;

		beforeEach(() => {
			logger = new Logger({ service: 'test-service', level: LogLevel.DEBUG });
		});

		it('should log debug messages', async () => {
			await logger.debug('Debug message');

			expect(mockStdoutWrite).toHaveBeenCalledTimes(1);
			const loggedOutput = mockStdoutWrite.mock.calls[0]?.[0];
			expect(loggedOutput).toContain('DEBUG');
			expect(loggedOutput).toContain('[test-service]');
			expect(loggedOutput).toContain('Debug message');
		});

		it('should log info messages', async () => {
			await logger.info('Info message');

			expect(mockStdoutWrite).toHaveBeenCalledTimes(1);
			const loggedOutput = mockStdoutWrite.mock.calls[0]?.[0];
			expect(loggedOutput).toContain('INFO');
			expect(loggedOutput).toContain('[test-service]');
			expect(loggedOutput).toContain('Info message');
		});

		it('should log warn messages', async () => {
			await logger.warn('Warn message');

			expect(mockStdoutWrite).toHaveBeenCalledTimes(1);
			const loggedOutput = mockStdoutWrite.mock.calls[0]?.[0];
			expect(loggedOutput).toContain('WARN');
			expect(loggedOutput).toContain('[test-service]');
			expect(loggedOutput).toContain('Warn message');
		});

		it('should log error messages', async () => {
			await logger.error('Error message');

			expect(mockStdoutWrite).toHaveBeenCalledTimes(1);
			const loggedOutput = mockStdoutWrite.mock.calls[0]?.[0];
			expect(loggedOutput).toContain('ERROR');
			expect(loggedOutput).toContain('[test-service]');
			expect(loggedOutput).toContain('Error message');
		});

		it('should log fatal messages', async () => {
			await logger.fatal('Fatal message');

			expect(mockStdoutWrite).toHaveBeenCalledTimes(1);
			const loggedOutput = mockStdoutWrite.mock.calls[0]?.[0];
			expect(loggedOutput).toContain('FATAL');
			expect(loggedOutput).toContain('[test-service]');
			expect(loggedOutput).toContain('Fatal message');
		});

		it('should include metadata when provided', async () => {
			await logger.info('Message with metadata', { userId: '123', duration: '245ms' });

			expect(mockStdoutWrite).toHaveBeenCalledTimes(1);
			const loggedOutput = mockStdoutWrite.mock.calls[0]?.[0];
			expect(loggedOutput).toContain('Message with metadata');
			expect(loggedOutput).toContain('{"userId":"123","duration":"245ms"}');
		});

		it('should not include metadata when not provided', async () => {
			await logger.info('Message without metadata');

			expect(mockStdoutWrite).toHaveBeenCalledTimes(1);
			const loggedOutput = mockStdoutWrite.mock.calls[0]?.[0];
			expect(loggedOutput).toContain('Message without metadata');
			expect(loggedOutput).not.toContain('{}');
		});
	});

	describe('JSON format', () => {
		it('should output JSON format when format is json', async () => {
			const logger = new Logger({
				service: 'test-service',
				level: LogLevel.INFO,
				format: 'json',
			});

			await logger.info('Test message', { userId: '123' });

			expect(mockStdoutWrite).toHaveBeenCalledTimes(1);
			const loggedOutput = String(mockStdoutWrite.mock.calls[0]?.[0]).trim();

			// Should be valid JSON
			const parsed = JSON.parse(loggedOutput);
			expect(parsed.level).toBe('info');
			expect(parsed.service).toBe('test-service');
			expect(parsed.message).toBe('Test message');
			expect(parsed.metadata).toEqual({ userId: '123' });
			expect(typeof parsed.timestamp).toBe('string');
		});

		it('should omit metadata field from JSON when not provided', async () => {
			const logger = new Logger({
				service: 'test-service',
				level: LogLevel.INFO,
				format: 'json',
			});

			await logger.info('No metadata');

			expect(mockStdoutWrite).toHaveBeenCalledTimes(1);
			const parsed = JSON.parse(String(mockStdoutWrite.mock.calls[0]?.[0]).trim());
			expect(parsed.metadata).toBeUndefined();
		});
	});

	describe('nanosecond timestamps', () => {
		it('should generate nanosecond timestamps as proper decimal strings (not scientific notation)', async () => {
			const before = Date.now();
			const logger = new Logger({ service: 'test-service', level: LogLevel.DEBUG });

			await logger.info('Test message');

			const after = Date.now();

			expect(mockStdoutWrite).toHaveBeenCalledTimes(1);
			const loggedOutput = String(mockStdoutWrite.mock.calls[0]?.[0]);

			// The rendered ISO timestamp must be a current-era date (not distant past/future)
			const isoMatch = loggedOutput.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/);
			expect(isoMatch).not.toBeNull();
			const renderedMs = new Date(isoMatch![0]).getTime();
			expect(renderedMs).toBeGreaterThanOrEqual(before);
			expect(renderedMs).toBeLessThanOrEqual(after);
		});
	});

	describe('transport error handling', () => {
		it('should catch transport errors and not propagate them', async () => {
			const mockTransport = {
				write: vi.fn().mockRejectedValue(new Error('Transport failed')),
			};
			const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

			try {
				const logger = new Logger({
					service: 'test-service',
					level: LogLevel.INFO,
					transport: mockTransport,
				});

				// Should not throw even though transport rejects
				await logger.info('Test message');

				expect(mockTransport.write).toHaveBeenCalled();
				expect(mockConsoleError).toHaveBeenCalledWith(
					'Error writing log entry to transport:',
					expect.any(Error),
				);
			} finally {
				mockConsoleError.mockRestore();
			}
		});

		it('should catch synchronous transport errors', async () => {
			const mockTransport = {
				write: vi.fn().mockImplementation(() => {
					throw new Error('Synchronous transport error');
				}),
			};
			const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

			try {
				const logger = new Logger({
					service: 'test-service',
					level: LogLevel.INFO,
					transport: mockTransport,
				});

				// Should not throw even though transport throws synchronously
				await logger.info('Test message');

				expect(mockTransport.write).toHaveBeenCalled();
				expect(mockConsoleError).toHaveBeenCalledWith(
					'Error writing log entry to transport:',
					expect.any(Error),
				);
			} finally {
				mockConsoleError.mockRestore();
			}
		});
	});
});
