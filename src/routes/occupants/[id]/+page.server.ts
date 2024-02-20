import { db } from '$lib/server/db/client';
import { occupants, selectOccupantSchema } from '$lib/server/db/schema';
import type { Load } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';

export const load: Load = async ({ params }) => {
	if (!params.id) return;

	const parsed = selectOccupantSchema.shape.id.safeParse(params.id);

	if (!parsed.success) {
		return {
			status: 400,
			error: parsed.error
		};
	}

	return {
		occupant: await db.query.occupants.findFirst({
			where: eq(occupants.id, parsed.data),
			with: {
				measuringDevices: true
			}
		})
	};
};
