import { db } from '$lib/server/db/client';
import type { Load } from '@sveltejs/kit';

export const load: Load = async () => {
	return {
		buildings: await db.query.buildings.findMany()
	};
};
