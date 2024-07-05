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

/** List formatter */
export function listFmt(value: Iterable<string>, options?: Intl.ListFormatOptions) {
	const defaultOptions: Intl.ListFormatOptions = {
		style: 'long',
		type: 'conjunction'
	};

	return new Intl.ListFormat(DEFAULT_LOCALE, mergeOptions(options, defaultOptions)).format(value);
}
