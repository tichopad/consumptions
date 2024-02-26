import { db } from '$lib/server/db/client';
import { buildings, energyBills, occupants, selectBuildingSchema } from '$lib/server/db/schema';
import { error, type Load } from '@sveltejs/kit';
import { asc, desc, eq } from 'drizzle-orm';

export const load: Load = async ({ params }) => {
	const parsed = selectBuildingSchema.shape.id.safeParse(params.id);

	if (!parsed.success) {
		error(400, 'Missing or invalid building ID.');
	}

	const building = await db.query.buildings.findFirst({
		where: eq(buildings.id, parsed.data),
		with: {
			energyBills: {
				orderBy: desc(energyBills.endDate)
			},
			occupants: {
				orderBy: asc(occupants.name)
			}
		}
	});

	if (building === undefined) {
		error(404, 'Building not found.');
	}

	return { building };
};
