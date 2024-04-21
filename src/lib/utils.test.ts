import { describe, it, expect } from 'vitest';
import { isEmptyStringTrimmed } from './utils';

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
