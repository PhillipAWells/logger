import { CreateJsonCircularReplacer } from '@pawells/typescript-common';

import type { ILogEntry } from './types.js';

/**
 * Formats a log entry as structured JSON for log aggregation platforms.
 * Produces a JSON string compatible with log aggregation services.
 * @param entry - The log entry to format
 * @returns JSON string representation of the log entry
 */
export function formatForJson(entry: ILogEntry): string {
	// Pre-extract critical fields so the catch block can build a safe fallback
	// without accessing `entry` again (which may be a proxy or have side-effectful getters).
	const { timestamp } = entry;
	const { level } = entry;
	const { service } = entry;
	const { message } = entry;

	try {
		const jsonEntry: Record<string, unknown> = {
			timestamp,
			level,
			service,
			message,
		};

		if (entry.metadata !== undefined) {
			jsonEntry.metadata = entry.metadata;
		}

		// Add optional trace fields if present
		if (entry.traceId) {
			jsonEntry.traceId = entry.traceId;
		}
		if (entry.spanId) {
			jsonEntry.spanId = entry.spanId;
		}
		if (entry.correlationId) {
			jsonEntry.correlationId = entry.correlationId;
		}

		return JSON.stringify(jsonEntry, CreateJsonCircularReplacer());
	} catch (error) {
		// Don't use console - return a safe fallback JSON string
		return JSON.stringify({
			timestamp,
			level,
			service,
			message: `Error formatting log entry: ${message}`,
			metadata: {
				originalError: String(error),
				errorType: error instanceof Error ? error.name : typeof error,
			},
		}, CreateJsonCircularReplacer());
	}
}
