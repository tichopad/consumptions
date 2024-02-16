import { db } from '$lib/server/db/client';
import { buildings, selectBuildingSchema } from '$lib/server/db/schema';
import { error, type Load } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';

export const load: Load = async ({ params }) => {
	const parsed = selectBuildingSchema.shape.id.safeParse(params.id);

	if (!parsed.success) {
		return error(404, 'Not found');
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
