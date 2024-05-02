import BigNumber from 'bignumber.js';
import { describe, expect, it } from 'vitest';
import { assert, isEmptyStringTrimmed, sumPreciseBy } from './utils';

describe('isEmptyStringTrimmed', () => {
	it('returns true given empty string', () => {
		const result = isEmptyStringTrimmed('');
		expect(result).toBe(true);
	});
	it('returns true given string with spaces', () => {
		const result = isEmptyStringTrimmed('   ');
		expect(result).toBe(true);
	});
	it('returns true given string with newlines', () => {
		const result = isEmptyStringTrimmed('\n \n ');
		expect(result).toBe(true);
	});
	it('returns false given non-empty string', () => {
		const result = isEmptyStringTrimmed('Good Anakin, kill him now.');
		expect(result).toBe(false);
	});
	it('returns false not given a string', () => {
		const result = isEmptyStringTrimmed(69_420);
		expect(result).toBe(false);
	});
	it('returns false given falsy non-string values', () => {
		const nullResult = isEmptyStringTrimmed(null);
		expect(nullResult).toBe(false);
		const undefinedResult = isEmptyStringTrimmed(undefined);
		expect(undefinedResult).toBe(false);
		const zeroResult = isEmptyStringTrimmed(0);
		expect(zeroResult).toBe(false);
	});
});

describe('sumPrecise', () => {
	it('should return 0 for an empty array', () => {
		const result = sumPreciseBy([], (i) => i);
		expect(result).toEqual(new BigNumber(0));
	});

	it('should correctly sum an array of numbers', () => {
		const numbers = [1, 2, 3, 4, 5];
		const result = sumPreciseBy(numbers, (i) => i);
		expect(result).toEqual(new BigNumber(15));
	});

	it('should correctly sum an array of objects with numeric properties', () => {
		const items = [{ cost: 10 }, { cost: 20 }, { cost: 30 }];
		const result = sumPreciseBy(items, (i) => i.cost);
		expect(result).toEqual(new BigNumber(60));
	});

	it('should handle nullable properties with default value', () => {
		const items = [{ cost: 10 }, { cost: null }, { cost: 30 }];
		const result = sumPreciseBy(items, (i) => i.cost ?? 0);
		expect(result).toEqual(new BigNumber(40));
	});

	it('should correctly sum large numbers', () => {
		const numbers = [1e15, 2e15, 3e15];
		const result = sumPreciseBy(numbers, (i) => i);
		expect(result).toEqual(new BigNumber('6e+15'));
	});

	it('should correctly sum decimal numbers', () => {
		const numbers = [0.1, 0.2, 0.3];
		const result = sumPreciseBy(numbers, (i) => i);
		expect(result).toEqual(new BigNumber('0.6'));
	});
});

describe('assert', () => {
	it('asserts a truthy condition', () => {
		expect(assert(1 === 1, 'It should be true'));
	});
	it('throws on a falsy condition', () => {
		const a: number = 1;
		const b: number = 2;
		expect(() => assert(a === b, 'It should not be true')).toThrow(/^It should not be true$/);
	});
});
