import type { Load } from '@sveltejs/kit';

export const load: Load = async ({ url }) => {
	const navLinks = [
		{ name: 'Přehled', href: '/' },
		// { name: 'Budovy', href: '/buildings' },
		{ name: 'Subjekty', href: '/occupants' },
		{ name: 'Vyúčtování', href: '/bills' }
	];

	const isActiveHref = (href: string) => {
		if (href === '/') return url.pathname === '/';
		return url.pathname.startsWith(href);
	};

	const activeHref = navLinks.find((navLink) => isActiveHref(navLink.href))?.href;

	return {
		navLinks,
		activeHref
	};
};
