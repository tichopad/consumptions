import { db } from '$lib/server/db/client';
import { occupants, selectOccupantSchema } from '$lib/server/db/schema';
import { error, type Load } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';

export const load: Load = async ({ params }) => {
	if (!params.id) return;

	const parsed = selectOccupantSchema.shape.id.safeParse(params.id);

	if (!parsed.success) {
		return error(400, 'Invalid id');
	}

	const occupant = await db.query.occupants.findFirst({
		where: eq(occupants.id, parsed.data),
		with: {
			measuringDevices: true
		}
	});

	if (!occupant) {
		return error(404, 'Occupant not found');
	}

	return { occupant };
};
