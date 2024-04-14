import { db } from '$lib/server/db/client';
import {
	insertMeasuringDeviceSchema,
	labelsByEnergyType,
	measuringDevices,
	occupants,
	selectOccupantSchema
} from '$lib/models/schema';
import { error, fail, type Actions, type Load } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { message, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { createOccupantFormSchema } from '../create-edit-form-schema';

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
		editOccupantForm: await superValidate(occupant, zod(createOccupantFormSchema))
	};
};

export const actions: Actions = {
	/**
	 * Handles measuring device creation
	 */
	createMeasuringDevice: async (event) => {
		const form = await superValidate(event, zod(insertMeasuringDeviceSchema));

		if (!form.valid) return fail(400, { form });

		const [newDevice] = await db.insert(measuringDevices).values(form.data).returning();

		if (newDevice === undefined) {
			return fail(500, { form, message: 'Failed to insert device to database' });
		}

		return message(
			form,
			`New ${labelsByEnergyType[newDevice.energyType].toLocaleLowerCase()} measuring device created.`
		);
	},
	editOccupant: async (event) => {
		const form = await superValidate(event, zod(createOccupantFormSchema));

		if (!form.valid) return fail(400, { form });

		const parsedId = selectOccupantSchema.shape.id.safeParse(event.params.id);

		if (!parsedId.success) return fail(400, { form });

		const [updatedOccupant] = await db
			.update(occupants)
			.set(form.data)
			.where(eq(occupants.id, parsedId.data))
			.returning();

		if (updatedOccupant === undefined) {
			return fail(500, { form, message: 'Failed to update occupant in database' });
		}

		return message(form, `${updatedOccupant.name} updated.`);
	}
};
