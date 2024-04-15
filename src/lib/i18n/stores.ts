import { derived, writable } from 'svelte/store';

/** Global locale store */
export const locale = writable('en-US');

/** Long date formatter */
export const dateFmt = derived(locale, ($l) => {
	return new Intl.DateTimeFormat($l, { dateStyle: 'long' });
});

/** General number formatter */
export const numberFmt = derived(locale, ($l) => {
	return new Intl.NumberFormat($l, { maximumFractionDigits: 2 });
});

/** Currency formatter */
export const currencyFmt = derived(locale, ($l) => {
	return new Intl.NumberFormat($l, {
		currency: 'CZK',
		maximumFractionDigits: 2,
		style: 'currency'
	});
});

/** Conjunction list formatter */
export const conjunctionListFmt = derived(locale, ($l) => {
	return new Intl.ListFormat($l, {
		style: 'long',
		type: 'conjunction'
	});
});

/** Conjunction list formatter */
export const disjunctionListFmt = derived(locale, ($l) => {
	return new Intl.ListFormat($l, {
		style: 'long',
		type: 'conjunction'
	});
});
