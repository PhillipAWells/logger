/**
 * Test file for Logger class
 * ESLint rules disabled for test files:
 * - no-magic-numbers: Test data inherently uses literal numbers for assertions and test scenarios
 */
 
import { vi } from 'vitest';
import { Logger } from './logger.ts';
import { LogLevel } from './types.ts';

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

		it('should use default level INFO when not specified', () => {
			const logger = new Logger({ service: 'test-service' });

			// Debug should not be logged
			logger.debug('debug message');
			expect(mockConsoleLog).not.toHaveBeenCalled();

			// Info should be logged
			logger.info('info message');
			expect(mockConsoleLog).toHaveBeenCalled();
		});
	});

	describe('log level filtering', () => {
		it('should filter debug logs when level is info', () => {
			const logger = new Logger({ service: 'test-service', level: LogLevel.INFO });

			logger.debug('debug message');
			expect(mockConsoleLog).not.toHaveBeenCalled();

			logger.info('info message');
			expect(mockConsoleLog).toHaveBeenCalledTimes(1);
		});

		it('should filter info and debug when level is warn', () => {
			const logger = new Logger({ service: 'test-service', level: LogLevel.WARN });

			logger.debug('debug message');
			logger.info('info message');
			expect(mockConsoleLog).not.toHaveBeenCalled();

			logger.warn('warn message');
			expect(mockConsoleLog).toHaveBeenCalledTimes(1);
		});

		it('should allow all levels when level is debug', () => {
			const logger = new Logger({ service: 'test-service', level: LogLevel.DEBUG });

			logger.debug('debug message');
			logger.info('info message');
			logger.warn('warn message');
			logger.error('error message');

			expect(mockConsoleLog).toHaveBeenCalledTimes(4);
		});
	});

	describe('log methods', () => {
		let logger: Logger;

		beforeEach(() => {
			logger = new Logger({ service: 'test-service', level: LogLevel.DEBUG });
		});

		it('should log debug messages', () => {
			logger.debug('Debug message');

			expect(mockConsoleLog).toHaveBeenCalledTimes(1);
			const loggedOutput = mockConsoleLog.mock.calls[0]?.[0];
			expect(loggedOutput).toContain('DEBUG');
			expect(loggedOutput).toContain('[test-service]');
			expect(loggedOutput).toContain('Debug message');
		});

		it('should log info messages', () => {
			logger.info('Info message');

			expect(mockConsoleLog).toHaveBeenCalledTimes(1);
			const loggedOutput = mockConsoleLog.mock.calls[0]?.[0];
			expect(loggedOutput).toContain('INFO');
			expect(loggedOutput).toContain('[test-service]');
			expect(loggedOutput).toContain('Info message');
		});

		it('should log warn messages', () => {
			logger.warn('Warn message');

			expect(mockConsoleLog).toHaveBeenCalledTimes(1);
			const loggedOutput = mockConsoleLog.mock.calls[0]?.[0];
			expect(loggedOutput).toContain('WARN');
			expect(loggedOutput).toContain('[test-service]');
			expect(loggedOutput).toContain('Warn message');
		});

		it('should log error messages', () => {
			logger.error('Error message');

			expect(mockConsoleLog).toHaveBeenCalledTimes(1);
			const loggedOutput = mockConsoleLog.mock.calls[0]?.[0];
			expect(loggedOutput).toContain('ERROR');
			expect(loggedOutput).toContain('[test-service]');
			expect(loggedOutput).toContain('Error message');
		});

		it('should include metadata when provided', () => {
			logger.info('Message with metadata', { userId: '123', duration: '245ms' });

			expect(mockConsoleLog).toHaveBeenCalledTimes(1);
			const loggedOutput = mockConsoleLog.mock.calls[0]?.[0];
			expect(loggedOutput).toContain('Message with metadata');
			expect(loggedOutput).toContain('{"userId":"123","duration":"245ms"}');
		});

		it('should not include metadata when not provided', () => {
			logger.info('Message without metadata');

			expect(mockConsoleLog).toHaveBeenCalledTimes(1);
			const loggedOutput = mockConsoleLog.mock.calls[0]?.[0];
			expect(loggedOutput).toContain('Message without metadata');
			expect(loggedOutput).not.toContain('{}');
		});
	});

	describe('JSON format', () => {
		it('should output JSON format when format is json', () => {
			const logger = new Logger({
				service: 'test-service',
				level: LogLevel.INFO,
				format: 'json',
			});

			logger.info('Test message', { userId: '123' });

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
