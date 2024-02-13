import { db } from '$lib/server/db/client';
import { occupants, selectOccupantSchema } from '$lib/server/db/schema';
import type { Load } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';

export const load: Load = async ({ params }) => {
	if (!params.id) return;

	const safeId = selectOccupantSchema.shape.id.safeParse(params.id);

	if (!safeId.success) {
		return {
			status: 400,
			error: safeId.error
		};
	}

	return {
		occupant: await db.query.occupants.findFirst({ where: eq(occupants.id, safeId.data) })
	};
};
