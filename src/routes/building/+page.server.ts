import { listBuildings } from '$lib/models';
import type { Load } from '@sveltejs/kit';

export const load: Load = () => {
	return {
		buildings: listBuildings()
	};
};
