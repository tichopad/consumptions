import type { Load } from '@sveltejs/kit';

export const load: Load = async ({ url }) => {
	const navLinks = [
		{ name: 'Dashboard', href: '/' },
		// { name: 'Buildings', href: '/buildings' },
		{ name: 'Occupants', href: '/occupants' },
		{ name: 'Bills', href: '/bills' }
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
