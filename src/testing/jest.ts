import { jest } from '@jest/globals';
import type { ILogEntry, ITransport } from '../types.js';

export interface MockTransport extends ITransport {
	write: jest.MockedFunction<(entry: ILogEntry) => void | Promise<void>>;
}

export function createMockTransport(): MockTransport {
	return { write: jest.fn() };
}
