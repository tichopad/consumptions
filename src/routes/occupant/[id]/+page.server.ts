import { getOccupant } from '$lib/models';
import type { Load } from '@sveltejs/kit';

export const load: Load = ({ params }) => {
	if (!params.id) return;

	const occupant = getOccupant(params.id);

	return {
		occupant
	};
};
