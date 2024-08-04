import type { DateRange } from '$lib/common-types';
import { unitsByEnergyType, type EnergyType } from '$lib/models/common';

export const DEFAULT_LOCALE = 'cs-CZ';

// Shallowly merges options with default options
function mergeOptions<TOptions>(options: TOptions | undefined, defaultOptions: TOptions): TOptions {
	return options ? { ...defaultOptions, ...options } : defaultOptions;
}

/** General number formatter */
export function numberFmt(value: number, options?: Intl.NumberFormatOptions) {
	const defaultOptions: Intl.NumberFormatOptions = {
		maximumFractionDigits: 2
	};

	return new Intl.NumberFormat(DEFAULT_LOCALE, mergeOptions(options, defaultOptions)).format(value);
}

/** Currency formatter */
export function currencyFmt(value: number) {
	return numberFmt(value, {
		currency: 'CZK',
		style: 'currency'
	});
}

/** Energy unit formatter */
export function energyUnitFmt(value: number, energyType: EnergyType) {
	const number = numberFmt(value, {
		style: 'decimal',
		minimumFractionDigits: 0,
		maximumFractionDigits: 2
	});
	return `${number} ${unitsByEnergyType[energyType]}`;
}

/** Date formatter */
export function dateFmt(value: Date | number, options?: Intl.DateTimeFormatOptions) {
	const defaultOptions: Intl.DateTimeFormatOptions = {
		dateStyle: 'full',
		timeStyle: 'short'
	};

	return new Intl.DateTimeFormat(DEFAULT_LOCALE, mergeOptions(options, defaultOptions)).format(
		value
	);
}

/** Formats a date range */
export function rangeDateFmt<TRange extends DateRange>(
	range: TRange,
	options: Intl.DateTimeFormatOptions = { dateStyle: 'long', timeStyle: undefined }
) {
	return `${dateFmt(range.start, options)} - ${dateFmt(range.end, options)}`;
}

/** List formatter */
export function listFmt(value: Iterable<string>, options?: Intl.ListFormatOptions) {
	const defaultOptions: Intl.ListFormatOptions = {
		style: 'long',
		type: 'conjunction'
	};

	return new Intl.ListFormat(DEFAULT_LOCALE, mergeOptions(options, defaultOptions)).format(value);
}
