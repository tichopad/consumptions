import BigNumber from 'bignumber.js';

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

/**
 * Calculates precise sum given an array of objects or numbers and a picker function.
 *
 * The picker function picks the property to be summed and can provide default values
 * in cases where the property is nullable.
 *
 * It's also a workaround so I don't have to fuck around with TS trying to infer this correctly.
 *
 * @example
 * const items = [{ cost: 30 }, { cost: 39 }, { cost: null }]
 * const totalCost = sumPreciseBy(items, (i) => i.cost ?? 0) // 69 (nice)
 */
export function sumPreciseBy<
	TItem extends Record<string | number, unknown> | number,
	TPicker extends (i: TItem) => number
>(items: TItem[], pickerFn: TPicker) {
	return items.reduce((acc, item) => acc.plus(pickerFn(item)), new BigNumber(0));
}
