import { db } from '$lib/server/db/client';
import {
	insertMeasuringDeviceSchema,
	measuringDevices,
	occupants,
	selectOccupantSchema
} from '$lib/server/db/schema';
import { error, fail, type Actions, type Load } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';

export const load: Load = async ({ params }) => {
	const parsed = selectOccupantSchema.shape.id.safeParse(params.id);

	if (!parsed.success) {
		error(400, 'Invalid id');
	}

	const occupant = await db.query.occupants.findFirst({
		where: eq(occupants.id, parsed.data),
		with: {
			measuringDevices: true
		}
	});

	if (occupant === undefined) {
		error(404, 'Occupant not found');
	}

	return { occupant };
};

export const actions: Actions = {
	createMeasuringDevice: async ({ request }) => {
		const formData = await request.formData();
		const body = Object.fromEntries(formData);

		console.log(body);

		const parsed = insertMeasuringDeviceSchema.safeParse(body);

		if (!parsed.success) {
			console.error(parsed.error);
			return fail(400, { errors: parsed.error });
		}

		console.log(parsed);

		const [newMeasuringDevice] = await db.insert(measuringDevices).values(parsed.data).returning();

		console.log(newMeasuringDevice);

		return {
			success: true,
			newMeasuringDevice
		};
	}
};
