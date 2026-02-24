import type { ILogEntry } from './types.js';

/**
 * Safely converts a value to JSON string, handling circular references.
 * @param obj - The object to stringify
 * @returns JSON string representation
 */
function safeStringify(obj: unknown): string {
	const seen = new WeakSet();
	return JSON.stringify(obj, (_key, value: unknown) => {
		if (typeof value === 'object' && value !== null) {
			if (seen.has(value as object)) return '[Circular]';
			seen.add(value as object);
		}
		return value;
	});
}

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

		return safeStringify(jsonEntry);
	} catch (error) {
		// Don't use console - return a safe fallback JSON string
		return safeStringify({
			timestamp,
			level,
			service,
			message: `Error formatting log entry: ${entry.message}`,
			metadata: { originalError: String(error) },
		});
	}
}
