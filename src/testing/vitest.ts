import { vi, type Mock } from 'vitest';
import type { ILogEntry, ITransport } from '../types.js';

export interface MockTransport extends ITransport {
	write: Mock<(entry: ILogEntry) => void | Promise<void>>;
}

export function createMockTransport(): MockTransport {
	return { write: vi.fn() };
}
