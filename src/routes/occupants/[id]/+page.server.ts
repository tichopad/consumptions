import {
	energyBills,
	insertMeasuringDeviceSchema,
	labelsByEnergyType,
	measuringDevices,
	occupants,
	selectOccupantSchema
} from '$lib/models/schema';
import { db } from '$lib/server/db/client';
import { error, fail, type Actions, type Load } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { message, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { createOccupantFormSchema } from '../create-edit-form-schema';
import { deleteDeviceFormSchema } from './delete-device-form-schema';
import { editDeviceFormSchema } from './edit-device-form-schema';
import { LibsqlError } from '@libsql/client';

export const load: Load = async ({ params }) => {
	const parsed = selectOccupantSchema.shape.id.safeParse(params.id);

	if (!parsed.success) error(400, 'Invalid id');

	const occupant = await db.query.occupants.findFirst({
		where: eq(occupants.id, parsed.data),
		with: {
			measuringDevices: {
				where: eq(measuringDevices.isDeleted, false)
			},
			energyBills: true
		}
	});

	if (occupant === undefined) {
		error(404, 'Occupant not found');
	}

	return {
		occupant,
		insertMeasuringDeviceForm: await superValidate(zod(insertMeasuringDeviceSchema)),
		editOccupantForm: await superValidate(occupant, zod(createOccupantFormSchema)),
		editMeasuringDeviceForm: await superValidate(zod(editDeviceFormSchema)),
		deleteMeasuringDeviceForm: await superValidate(zod(deleteDeviceFormSchema))
	};
};

export const actions: Actions = {
	/**
	 * Handles occupant updates
	 */
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
	},
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
	/**
	 * Handles updating occupant's measuring device
	 */
	editMeasuringDevice: async (event) => {
		const form = await superValidate(event, zod(editDeviceFormSchema));

		if (!form.valid) return fail(400, { form });

		const [device] = await db
			.update(measuringDevices)
			.set(form.data)
			.where(eq(measuringDevices.id, form.data.id))
			.returning();

		if (device === undefined) {
			return fail(500, { form, message: 'Failed to update device in database' });
		}

		return message(form, `Measuring device ${device.name} updated.`);
	},
	/**
	 * Handles deleting measuring device
	 */
	deleteMeasuringDevice: async (event) => {
		const form = await superValidate(event, zod(deleteDeviceFormSchema));

		if (!form.valid) return fail(400, { form });

		try {
			await db.delete(measuringDevices).where(eq(measuringDevices.id, form.data.deviceId));
		} catch (error) {
			// FIXME: check if the foreign constraint failed, it means there are live relations, in which case
			// we should soft-delete instead
			console.log(error);
			if (error instanceof LibsqlError && error.code === 'SQLITE_CONSTRAINT') {
				await db
					.update(measuringDevices)
					.set({ isDeleted: true })
					.where(eq(measuringDevices.id, form.data.deviceId));
			}
			return;
		}

		return message(form, `Measuring device ${form.data.name} deleted.`);
	}
};
