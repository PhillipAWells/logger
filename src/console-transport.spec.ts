import { ConsoleTransport } from './console-transport.js';
import { LogLevel } from './types.js';
import type { ILogEntry, IWritableStream } from './types.js';

function createMockStream(isTTY?: boolean): { stream: IWritableStream; lines: () => string[] } {
	const chunks: string[] = [];
	const stream: IWritableStream = {
		write(chunk: string): void {
			chunks.push(chunk);
		},
		...(isTTY !== undefined && { isTTY }),
	};
	return { stream, lines: () => chunks };
}

const baseEntry: ILogEntry = {
	timestamp: '1705257983000000000',
	level: LogLevel.INFO,
	service: 'test-service',
	message: 'Test message',
};

describe('ConsoleTransport', () => {
	describe('text format — trace fields', () => {
		it('should include traceId when present', () => {
			const { stream, lines } = createMockStream();
			const transport = new ConsoleTransport({ service: 'test-service' }, stream);

			transport.write({ ...baseEntry, traceId: 'trace-abc-123' });

			expect(lines()[0]).toContain('traceId=trace-abc-123');
		});

		it('should include spanId when present', () => {
			const { stream, lines } = createMockStream();
			const transport = new ConsoleTransport({ service: 'test-service' }, stream);

			transport.write({ ...baseEntry, spanId: 'span-def-456' });

			expect(lines()[0]).toContain('spanId=span-def-456');
		});

		it('should include correlationId when present', () => {
			const { stream, lines } = createMockStream();
			const transport = new ConsoleTransport({ service: 'test-service' }, stream);

			transport.write({ ...baseEntry, correlationId: 'corr-ghi-789' });

			expect(lines()[0]).toContain('correlationId=corr-ghi-789');
		});

		it('should include all trace fields when all are present', () => {
			const { stream, lines } = createMockStream();
			const transport = new ConsoleTransport({ service: 'test-service' }, stream);

			transport.write({
				...baseEntry,
				traceId: 'trace-abc-123',
				spanId: 'span-def-456',
				correlationId: 'corr-ghi-789',
			});

			const [output] = lines();
			expect(output).toContain('traceId=trace-abc-123');
			expect(output).toContain('spanId=span-def-456');
			expect(output).toContain('correlationId=corr-ghi-789');
		});

		it('should format all trace fields inside square brackets', () => {
			const { stream, lines } = createMockStream();
			const transport = new ConsoleTransport({ service: 'test-service' }, stream);

			transport.write({
				...baseEntry,
				traceId: 'trace-abc-123',
				spanId: 'span-def-456',
			});

			expect(lines()[0]).toContain('[traceId=trace-abc-123, spanId=span-def-456]');
		});

		it('should omit trace brackets when no trace fields are present', () => {
			const { stream, lines } = createMockStream();
			const transport = new ConsoleTransport({ service: 'test-service' }, stream);

			transport.write(baseEntry);

			const [output] = lines();
			expect(output).not.toContain('traceId');
			expect(output).not.toContain('spanId');
			expect(output).not.toContain('correlationId');
		});

		it('should place trace info between service name and message', () => {
			const { stream, lines } = createMockStream();
			const transport = new ConsoleTransport({ service: 'test-service' }, stream);

			transport.write({ ...baseEntry, traceId: 'trace-123' });

			const [output] = lines();
			const serviceIdx = output.indexOf('[test-service]');
			const traceIdx = output.indexOf('[traceId=trace-123]');
			const messageIdx = output.indexOf('Test message');
			expect(serviceIdx).toBeLessThan(traceIdx);
			expect(traceIdx).toBeLessThan(messageIdx);
		});
	});

	describe('ANSI colors and isTTY', () => {
		it('should apply ANSI color codes when isTTY is true', () => {
			const { stream, lines } = createMockStream(true);
			const transport = new ConsoleTransport({ service: 'test-service' }, stream);

			transport.write({ ...baseEntry, level: LogLevel.INFO });

			// Green ANSI code \x1b[32m should be present
			expect(lines()[0]).toContain('\x1b[32m');
		});

		it('should not apply ANSI color codes when isTTY is false', () => {
			const { stream, lines } = createMockStream(false);
			const transport = new ConsoleTransport({ service: 'test-service' }, stream);

			transport.write({ ...baseEntry, level: LogLevel.INFO });

			expect(lines()[0]).not.toContain('\x1b[');
		});

		it('should not apply ANSI color codes when isTTY is undefined', () => {
			const { stream, lines } = createMockStream(); // no isTTY set
			const transport = new ConsoleTransport({ service: 'test-service' }, stream);

			transport.write({ ...baseEntry, level: LogLevel.DEBUG });

			expect(lines()[0]).not.toContain('\x1b[');
		});

		it('should use correct color per level when isTTY is true', () => {
			const cases: Array<[LogLevel, string]> = [
				[LogLevel.DEBUG, '\x1b[36m'], // Cyan
				[LogLevel.INFO, '\x1b[32m'],  // Green
				[LogLevel.WARN, '\x1b[33m'],  // Yellow
				[LogLevel.ERROR, '\x1b[31m'], // Red
				[LogLevel.FATAL, '\x1b[35m'], // Magenta
			];

			for (const [level, expectedCode] of cases) {
				const { stream, lines } = createMockStream(true);
				const transport = new ConsoleTransport({ service: 'svc' }, stream);
				transport.write({ ...baseEntry, level });
				expect(lines()[0]).toContain(expectedCode);
			}
		});

		it('should return level without ANSI codes for unknown level on TTY', () => {
			const { stream, lines } = createMockStream(true);
			const transport = new ConsoleTransport({ service: 'svc' }, stream);

			transport.write({ ...baseEntry, level: 'SILENT' as LogLevel });

			expect(lines()[0]).toContain('SILENT');
			expect(lines()[0]).not.toContain('\x1b[');
		});
	});

	describe('text format — general', () => {
		it('should include ISO timestamp, level, service, and message', () => {
			const { stream, lines } = createMockStream();
			const transport = new ConsoleTransport({ service: 'my-service' }, stream);

			transport.write({ ...baseEntry, service: 'my-service', message: 'hello world' });

			const [output] = lines();
			expect(output).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/);
			expect(output).toContain('INFO');
			expect(output).toContain('[my-service]');
			expect(output).toContain('hello world');
		});

		it('should include metadata when provided', () => {
			const { stream, lines } = createMockStream();
			const transport = new ConsoleTransport({ service: 'test-service' }, stream);

			transport.write({ ...baseEntry, metadata: { userId: '42' } });

			expect(lines()[0]).toContain('{"userId":"42"}');
		});

		it('should not include metadata section when metadata is absent', () => {
			const { stream, lines } = createMockStream();
			const transport = new ConsoleTransport({ service: 'test-service' }, stream);

			transport.write(baseEntry);

			expect(lines()[0]).not.toContain('{}');
		});

		it('should not include metadata section when metadata is empty object', () => {
			const { stream, lines } = createMockStream();
			const transport = new ConsoleTransport({ service: 'test-service' }, stream);

			transport.write({ ...baseEntry, metadata: {} });

			expect(lines()[0]).not.toContain('{}');
		});

		it('should handle circular references in metadata without throwing', () => {
			const { stream, lines } = createMockStream();
			const transport = new ConsoleTransport({ service: 'test-service' }, stream);
			const circular: Record<string, unknown> = { prop: 'value' };
			circular.self = circular;

			expect(() => transport.write({ ...baseEntry, metadata: circular })).not.toThrow();
			expect(lines()[0]).toContain('[Circular]');
		});

		it('should serialize shared references correctly in metadata', () => {
			const { stream, lines } = createMockStream();
			const transport = new ConsoleTransport({ service: 'test-service' }, stream);
			const shared = { x: 1 };

			transport.write({ ...baseEntry, metadata: { a: shared, b: shared } });

			const [output] = lines();
			expect(output).toContain('"a":{"x":1}');
			expect(output).toContain('"b":{"x":1}');
			expect(output).not.toContain('[Circular]');
		});
	});

	describe('JSON format', () => {
		it('should output valid JSON when format is json', () => {
			const { stream, lines } = createMockStream();
			const transport = new ConsoleTransport({ service: 'test-service', format: 'json' }, stream);

			transport.write({ ...baseEntry, metadata: { req: 'id-1' } });

			const parsed = JSON.parse(lines()[0].trim());
			expect(parsed.level).toBe('info');
			expect(parsed.service).toBe('test-service');
			expect(parsed.message).toBe('Test message');
			expect(parsed.metadata).toEqual({ req: 'id-1' });
		});
	});
});
