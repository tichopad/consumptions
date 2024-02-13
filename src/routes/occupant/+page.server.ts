import { db } from '$lib/server/db/client';
import type { Load } from '@sveltejs/kit';

export const load: Load = async () => {
	const occupants = await db.query.occupants.findMany();

	return {
		occupants
	};
};
