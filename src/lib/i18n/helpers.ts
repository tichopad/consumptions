import { unitsByEnergyType, type EnergyType } from '$lib/models/common';

export const DEFAULT_LOCALE = 'cs-CZ';

// Shallowly merges options with default options
function mergeOptions<TOptions>(options: TOptions | undefined, defaultOptions: TOptions): TOptions {
	return options ? { ...defaultOptions, ...options } : defaultOptions;
}

/** General number formatter */
export function numberFmt(value: number, options?: Intl.NumberFormatOptions): string {
	const defaultOptions: Intl.NumberFormatOptions = {
		maximumFractionDigits: 2
	};

	return new Intl.NumberFormat(DEFAULT_LOCALE, mergeOptions(options, defaultOptions)).format(value);
}

/** Currency formatter */
export function currencyFmt(value: number): string {
	return numberFmt(value, {
		currency: 'CZK',
		style: 'currency'
	});
}

/** Energy unit formatter */
export function energyUnitFmt(value: number, energyType: EnergyType): string {
	const number = numberFmt(value, {
		style: 'decimal',
		minimumFractionDigits: 0,
		maximumFractionDigits: 2
	});
	return `${number} ${unitsByEnergyType[energyType]}`;
}

/** Date formatter */
export function dateFmt(value: Date | number, options?: Intl.DateTimeFormatOptions): string {
	const defaultOptions: Intl.DateTimeFormatOptions = {
		dateStyle: 'full',
		timeStyle: 'short'
	};

	return new Intl.DateTimeFormat(DEFAULT_LOCALE, mergeOptions(options, defaultOptions)).format(
		value
	);
}

/** Common start/end date range used by database entities */
type StartEndDateRange = {
	startDate: Date;
	endDate: Date;
};

/**
 * Formats a start/end date range
 * @param range The range to format
 * @param options The options to use for formatting the date
 */
export function startEndDateFmt<TRange extends StartEndDateRange>(
	range: TRange,
	options: Intl.DateTimeFormatOptions = { dateStyle: 'long', timeStyle: undefined }
): string {
	return `${dateFmt(range.startDate, options)} - ${dateFmt(range.endDate, options)}`;
}

/** List formatter */
export function listFmt(value: Iterable<string>, options?: Intl.ListFormatOptions): string {
	const defaultOptions: Intl.ListFormatOptions = {
		style: 'long',
		type: 'conjunction'
	};

	return new Intl.ListFormat(DEFAULT_LOCALE, mergeOptions(options, defaultOptions)).format(value);
}
