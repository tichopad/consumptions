import { db } from '$lib/server/db/client';
import {
	insertMeasuringDeviceSchema,
	measuringDevices,
	occupants,
	selectOccupantSchema
} from '$lib/models/schema';
import { error, fail, type Actions, type Load } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { message, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { createOccupantFormSchema } from '../create-edit-form-schema';

const editOccupantFormSchema = createOccupantFormSchema;

export const load: Load = async ({ params }) => {
	const parsed = selectOccupantSchema.shape.id.safeParse(params.id);

	if (!parsed.success) {
		error(400, 'Invalid id');
	}

	const occupant = await db.query.occupants.findFirst({
		where: eq(occupants.id, parsed.data),
		with: {
			measuringDevices: true,
			energyBills: true
		}
	});

	if (occupant === undefined) {
		error(404, 'Occupant not found');
	}

	return {
		occupant,
		insertMeasuringDeviceForm: await superValidate(zod(insertMeasuringDeviceSchema)),
		editOccupantForm: await superValidate(occupant, zod(editOccupantFormSchema))
	};
};

export const actions: Actions = {
	createMeasuringDevice: async (event) => {
		const form = await superValidate(event, zod(insertMeasuringDeviceSchema));

		if (!form.valid) return fail(400, { form });

		await db.insert(measuringDevices).values(form.data).returning();

		form.message = 'Measuring device created';

		return { form };
	},
	editOccupant: async (event) => {
		console.group('editOccupant');

		console.log(event.params);

		const form = await superValidate(event, zod(editOccupantFormSchema));

		console.log({ valid: form.valid });

		if (!form.valid) return fail(400, { form });

		const parsedId = selectOccupantSchema.shape.id.safeParse(event.params.id);

		console.log({ parsedId });

		if (!parsedId.success) return fail(400, { form });

		const [updatedOccupant] = await db
			.update(occupants)
			.set(form.data)
			.where(eq(occupants.id, parsedId.data))
			.returning();

		console.log({ updatedOccupant });

		console.groupEnd();

		return message(form, `Occupant ${updatedOccupant.name} updated.`);
	}
};
