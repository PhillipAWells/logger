import type { ILogEntry } from './types.js';

/**
 * Safely converts a value to JSON string, handling circular references.
 * Uses ancestor-stack tracking to correctly distinguish true circular references
 * from shared (diamond) references, which are serialized normally.
 * @param obj - The object to stringify
 * @returns JSON string representation
 */
export function safeStringify(obj: unknown): string {
	const ancestors: object[] = [];
	// Regular function (not arrow) so `this` refers to the containing object,
	// allowing us to locate the current node's parent in the ancestor stack.
	return JSON.stringify(obj, function(this: unknown, _key: string, value: unknown) {
		if (typeof value !== 'object' || value === null) {
			return value;
		}
		const parent = this as object;
		const parentIndex = ancestors.lastIndexOf(parent);
		// Trim the stack back to the current parent so sibling branches
		// do not bleed into each other's ancestor lists.
		ancestors.splice(parentIndex + 1);
		if (ancestors.includes(value as object)) {
			return '[Circular]';
		}
		ancestors.push(value as object);
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

		return safeStringify(jsonEntry);
	} catch (error) {
		// Don't use console - return a safe fallback JSON string
		return safeStringify({
			timestamp,
			level,
			service,
			message: `Error formatting log entry: ${message}`,
			metadata: {
				originalError: String(error),
				errorType: error instanceof Error ? error.name : typeof error,
			},
		});
	}
}
