import {
	insertMeasuringDeviceSchema,
	labelsByEnergyType,
	measuringDevices,
	occupants,
	selectOccupantSchema
} from '$lib/models/schema';
import { db } from '$lib/server/db/client';
import { isFailedForeignKeyConstraint } from '$lib/server/db/helpers';
import { error, fail, type Actions, type Load } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { message, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { createOccupantFormSchema } from '../create-edit-form-schema';
import { deleteDeviceFormSchema } from './delete-device-form-schema';
import { editDeviceFormSchema } from './edit-device-form-schema';

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

		const insertDevice = db.insert(measuringDevices).values(form.data).returning();
		const updateOccupant = db
			.update(occupants)
			.set({ updated: new Date() })
			.where(eq(occupants.id, form.data.occupantId));

		const [insertDeviceResult] = await db.batch([insertDevice, updateOccupant]);
		const [newDevice] = insertDeviceResult;

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

		// FIXME: Potentially unnecessary database call - refactor later
		const device = await db.query.measuringDevices.findFirst({
			where: eq(measuringDevices.id, form.data.deviceId)
		});

		if (device === undefined) {
			return fail(404, { form, message: 'Device not found' });
		}

		// Occupant update operation that happens after the device is removed
		// I want to make sure the occupant is not updated unless the device
		// got deleted
		const touchOccupant = () => {
			return db
				.update(occupants)
				.set({ updated: new Date() })
				.where(eq(occupants.id, device.occupantId));
		};

		try {
			// Soft-deleting is the way to go, but let's first try hard delete to safe storage
			const deleteDevice = db
				.delete(measuringDevices)
				.where(eq(measuringDevices.id, form.data.deviceId));
			await db.batch([deleteDevice, touchOccupant()]);
		} catch (error) {
			console.log(error);
			// The device has live relations, so we soft-delete instead
			if (isFailedForeignKeyConstraint(error)) {
				const softDeleteDevice = db
					.update(measuringDevices)
					.set({ isDeleted: true, deleted: new Date() })
					.where(eq(measuringDevices.id, form.data.deviceId));
				await db.batch([softDeleteDevice, touchOccupant()]);
			}
		}

		return message(form, `Measuring device ${form.data.name} deleted.`);
	}
};
