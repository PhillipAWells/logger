import type { ILogEntry } from './types.ts';

/**
 * Formats a log entry as structured JSON for log aggregation platforms.
 * Produces a JSON string compatible with log aggregation services.
 * @param entry - The log entry to format
 * @returns JSON string representation of the log entry
 */
export function formatForJson(entry: ILogEntry): string {
	// Pre-extract critical fields before JSON.stringify to handle circular references
	const { timestamp } = entry;
	const { level } = entry;
	const { service } = entry;

	try {
		const jsonEntry = {
			timestamp,
			level,
			service,
			message: entry.message,
			metadata: entry.metadata ?? {},
		};

		return JSON.stringify(jsonEntry);
	} catch (error) {
		// Don't throw - just log to console and return a safe fallback
		console.error('Error formatting log entry to JSON:', error);
		return JSON.stringify({
			timestamp,
			level,
			service,
			message: `Error formatting log entry: ${entry.message}`,
			metadata: { originalError: String(error) },
		});
	}
}
