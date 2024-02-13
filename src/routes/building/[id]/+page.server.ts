import { db } from '$lib/server/db/client';
import { buildings, selectBuildingSchema } from '$lib/server/db/schema';
import type { Load } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';

export const load: Load = async ({ params }) => {
	const parsed = selectBuildingSchema.shape.id.safeParse(params.id);

	if (!parsed.success) {
		return {
			status: 400,
			error: parsed.error
		};
	}

	return {
		building: await db.query.buildings.findFirst({
			where: eq(buildings.id, parsed.data),
			with: {
				energyBills: true,
				occupants: true
			}
		})
	};
};
