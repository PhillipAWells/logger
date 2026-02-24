/**
 * Test file for Logger class
 * ESLint rules disabled for test files:
 * - no-magic-numbers: Test data inherently uses literal numbers for assertions and test scenarios
 */
 
import { vi } from 'vitest';
import { Logger } from './logger.js';
import { LogLevel } from './types.js';

// Mock console.log to capture output
const mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});

describe('Logger', () => {
	beforeEach(() => {
		mockConsoleLog.mockClear();
	});

	afterAll(() => {
		mockConsoleLog.mockRestore();
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
			expect(mockConsoleLog).not.toHaveBeenCalled();

			// Info should be logged
			await logger.info('info message');
			expect(mockConsoleLog).toHaveBeenCalled();
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
	});

	describe('log level filtering', () => {
		it('should filter debug logs when level is info', async () => {
			const logger = new Logger({ service: 'test-service', level: LogLevel.INFO });

			await logger.debug('debug message');
			expect(mockConsoleLog).not.toHaveBeenCalled();

			await logger.info('info message');
			expect(mockConsoleLog).toHaveBeenCalledTimes(1);
		});

		it('should filter info and debug when level is warn', async () => {
			const logger = new Logger({ service: 'test-service', level: LogLevel.WARN });

			await logger.debug('debug message');
			await logger.info('info message');
			expect(mockConsoleLog).not.toHaveBeenCalled();

			await logger.warn('warn message');
			expect(mockConsoleLog).toHaveBeenCalledTimes(1);
		});

		it('should allow all levels when level is debug', async () => {
			const logger = new Logger({ service: 'test-service', level: LogLevel.DEBUG });

			await logger.debug('debug message');
			await logger.info('info message');
			await logger.warn('warn message');
			await logger.error('error message');

			expect(mockConsoleLog).toHaveBeenCalledTimes(4);
		});

		it('should allow fatal level when level is error', async () => {
			const logger = new Logger({ service: 'test-service', level: LogLevel.ERROR });

			await logger.warn('warn message');
			await logger.error('error message');
			await logger.fatal('fatal message');

			expect(mockConsoleLog).toHaveBeenCalledTimes(2);
		});

		it('should filter all logs when level is fatal', async () => {
			const logger = new Logger({ service: 'test-service', level: LogLevel.FATAL });

			await logger.debug('debug message');
			await logger.info('info message');
			await logger.warn('warn message');
			await logger.error('error message');
			expect(mockConsoleLog).not.toHaveBeenCalled();

			await logger.fatal('fatal message');
			expect(mockConsoleLog).toHaveBeenCalledTimes(1);
		});
	});

	describe('log methods', () => {
		let logger: Logger;

		beforeEach(() => {
			logger = new Logger({ service: 'test-service', level: LogLevel.DEBUG });
		});

		it('should log debug messages', async () => {
			await logger.debug('Debug message');

			expect(mockConsoleLog).toHaveBeenCalledTimes(1);
			const loggedOutput = mockConsoleLog.mock.calls[0]?.[0];
			expect(loggedOutput).toContain('DEBUG');
			expect(loggedOutput).toContain('[test-service]');
			expect(loggedOutput).toContain('Debug message');
		});

		it('should log info messages', async () => {
			await logger.info('Info message');

			expect(mockConsoleLog).toHaveBeenCalledTimes(1);
			const loggedOutput = mockConsoleLog.mock.calls[0]?.[0];
			expect(loggedOutput).toContain('INFO');
			expect(loggedOutput).toContain('[test-service]');
			expect(loggedOutput).toContain('Info message');
		});

		it('should log warn messages', async () => {
			await logger.warn('Warn message');

			expect(mockConsoleLog).toHaveBeenCalledTimes(1);
			const loggedOutput = mockConsoleLog.mock.calls[0]?.[0];
			expect(loggedOutput).toContain('WARN');
			expect(loggedOutput).toContain('[test-service]');
			expect(loggedOutput).toContain('Warn message');
		});

		it('should log error messages', async () => {
			await logger.error('Error message');

			expect(mockConsoleLog).toHaveBeenCalledTimes(1);
			const loggedOutput = mockConsoleLog.mock.calls[0]?.[0];
			expect(loggedOutput).toContain('ERROR');
			expect(loggedOutput).toContain('[test-service]');
			expect(loggedOutput).toContain('Error message');
		});

		it('should log fatal messages', async () => {
			await logger.fatal('Fatal message');

			expect(mockConsoleLog).toHaveBeenCalledTimes(1);
			const loggedOutput = mockConsoleLog.mock.calls[0]?.[0];
			expect(loggedOutput).toContain('FATAL');
			expect(loggedOutput).toContain('[test-service]');
			expect(loggedOutput).toContain('Fatal message');
		});

		it('should include metadata when provided', async () => {
			await logger.info('Message with metadata', { userId: '123', duration: '245ms' });

			expect(mockConsoleLog).toHaveBeenCalledTimes(1);
			const loggedOutput = mockConsoleLog.mock.calls[0]?.[0];
			expect(loggedOutput).toContain('Message with metadata');
			expect(loggedOutput).toContain('{"userId":"123","duration":"245ms"}');
		});

		it('should not include metadata when not provided', async () => {
			await logger.info('Message without metadata');

			expect(mockConsoleLog).toHaveBeenCalledTimes(1);
			const loggedOutput = mockConsoleLog.mock.calls[0]?.[0];
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

			expect(mockConsoleLog).toHaveBeenCalledTimes(1);
			const loggedOutput = mockConsoleLog.mock.calls[0]?.[0];

			// Should be valid JSON
			const parsed = JSON.parse(loggedOutput);
			expect(parsed.level).toBe('info');
			expect(parsed.service).toBe('test-service');
			expect(parsed.message).toBe('Test message');
			expect(parsed.metadata).toEqual({ userId: '123' });
			expect(typeof parsed.timestamp).toBe('string');
		});
	});
});
