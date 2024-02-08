import { getBuilding } from '$lib/models';
import type { Load } from '@sveltejs/kit';

export const load: Load = ({ params }) => {
	if (!params.id) return;

	const building = getBuilding(params.id);

	return {
		building
	};
};
