import type { Load } from '@sveltejs/kit';

export const load: Load = async ({ url }) => {
	const navLinks = [
		{ name: 'Přehled', href: '/' },
		// { name: 'Budovy', href: '/buildings' },
		{ name: 'Subjekty', href: '/occupants' },
		{ name: 'Vyúčtování', href: '/bills' }
	];

	const isActiveHref = (navLink: (typeof navLinks)[number]) => {
		if (navLink.href === '/') return url.pathname === '/';
		return url.pathname.startsWith(navLink.href);
	};

	const activeHref = navLinks.find(isActiveHref)?.href;

	return {
		navLinks,
		activeHref
	};
};
