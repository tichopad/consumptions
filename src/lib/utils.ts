/**
 * Typeguard that checks if a value is null or undefined
 */
export function isNullable<T>(value: T | null | undefined): value is null | undefined {
	return value === null || value === undefined;
}

/**
 * Typeguard that checks if a value is a string, trims it and checks if it's empty
 */
export function isEmptyStringTrimmed(value: unknown): value is string {
	return typeof value === 'string' && value.trim() === '';
}
