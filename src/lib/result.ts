/**
 * A simple Result type inspired by Rust's type of the same name.
 * Describes the result of an operation - either success or a fail
 */
export type Result<T, E> = { success: true; value: T } | { success: false; error: E };

/** Returns a successful result */
export function ok<T>(value: T): Result<T, never> {
	return { success: true, value };
}

/** Returns an error result */
export function err<E>(error: E): Result<never, E> {
	return { success: false, error };
}

/** Checks if the Result is successful */
export function isOk<T, E>(result: Result<T, E>): result is { success: true; value: T } {
	return result.success;
}

/** Checks if the Result is error */
export function isErr<T, E>(result: Result<T, E>): result is { success: false; error: E } {
	return !result.success;
}

/** Unwraps a Result either to its concrete value or throws if the Result is an error */
export function unwrap<T, E>(result: Result<T, E>): T {
	if (isOk(result)) {
		return result.value;
	} else {
		throw new Error(`Unwrapped error: ${JSON.stringify(result.error)}`);
	}
}

/** Wraps a throwable task into a Result */
export async function tryCatchAsync<T, E>(
	fn: () => Promise<T>,
	mapError: (err: unknown) => E
): Promise<Result<T, E>> {
	try {
		const value = await fn();
		return ok(value);
	} catch (error) {
		return err(mapError(error));
	}
}

/** Wraps a task into a Result */
export function tryCatch<T, E>(fn: () => T, mapError: (err: unknown) => E): Result<T, E> {
	try {
		const value = fn();
		return ok(value);
	} catch (error) {
		return err(mapError(error));
	}
}
