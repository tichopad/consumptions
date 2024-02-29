import { db } from '$lib/server/db/client';
import {
	insertMeasuringDeviceSchema,
	measuringDevices,
	occupants,
	selectOccupantSchema
} from '$lib/models/schema';
import { error, fail, type Actions, type Load } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';

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

	return {
		occupant,
		form: await superValidate(zod(insertMeasuringDeviceSchema))
	};
};

export const actions: Actions = {
	createMeasuringDevice: async (event) => {
		const form = await superValidate(event, zod(insertMeasuringDeviceSchema));

		if (!form.valid) return fail(400, { form });

		await db.insert(measuringDevices).values(form.data).returning();

		form.message = 'Measuring device created';

		return { form };
	}
};
