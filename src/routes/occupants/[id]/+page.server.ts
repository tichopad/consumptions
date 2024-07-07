import {
	insertMeasuringDeviceSchema,
	measuringDevices,
	occupants,
	selectOccupantSchema,
	type EnergyType
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
import { addDeviceFormSchema } from './add-device-form-schema';
import { logger } from '$lib/logger';

export const load: Load = async ({ params }) => {
	const parsed = selectOccupantSchema.shape.id.safeParse(params.id);

	if (!parsed.success) {
		logger.error({ parsed }, 'Failed to parse id');
		error(400, 'Neplatné ID subjektu');
	}

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
		logger.error({ occupantId: parsed.data }, 'Failed to find occupant');
		error(404, 'Subjekt nenalezen');
	}

	return {
		occupant,
		// Set `errors: false` to prevent displaying error messages in the initial form load
		insertMeasuringDeviceForm: await superValidate(zod(addDeviceFormSchema), { errors: false }),
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
			return fail(500, { form, message: 'Nepodařilo se aktualizovat subjekt v databázi' });
		}

		return message(form, `Subjekt ${updatedOccupant.name} byl aktualizován.`);
	},
	/**
	 * Handles measuring device creation
	 */
	createMeasuringDevice: async (event) => {
		const form = await superValidate(event, zod(insertMeasuringDeviceSchema));

		logger.info({ form }, 'Handling createMeasuringDevice action');

		if (!form.valid) return message(form, 'Údaje měřícího zařízení nebyly správně vyplněny.');

		const insertDevice = db.insert(measuringDevices).values(form.data).returning();
		const updateOccupant = db
			.update(occupants)
			.set({ updated: new Date() })
			.where(eq(occupants.id, form.data.occupantId));

		const [insertDeviceResult] = await db.batch([insertDevice, updateOccupant]);
		const [newDevice] = insertDeviceResult;

		if (newDevice === undefined) {
			return error(500, { message: 'Nepodařilo se vložit měřící zařízení do databáze' });
		}

		const inflectedLowerCaseEnergyTypeLabels: Record<EnergyType, string> = {
			electricity: 'elektřinu',
			water: 'vodu',
			heating: 'teplo'
		};

		return message(
			form,
			`Nové měřící zařízení pro ${inflectedLowerCaseEnergyTypeLabels[newDevice.energyType]} bylo vytvořeno.`
		);
	},
	/**
	 * Handles updating occupant's measuring device
	 */
	editMeasuringDevice: async (event) => {
		const form = await superValidate(event, zod(editDeviceFormSchema));

		if (!form.valid) return message(form, 'Údaje měřícího zařízení nebyly správně vyplněny.');

		const [device] = await db
			.update(measuringDevices)
			.set(form.data)
			.where(eq(measuringDevices.id, form.data.id))
			.returning();

		if (device === undefined) {
			return error(500, { message: 'Nepodařilo se aktualizovat měřící zařízení v databázi' });
		}

		return message(form, `Měřící zařízení ${device.name} bylo aktualizováno.`);
	},
	/**
	 * Handles deleting measuring device
	 */
	deleteMeasuringDevice: async (event) => {
		const form = await superValidate(event, zod(deleteDeviceFormSchema));

		if (!form.valid) return message(form, 'Údaje měřícího zařízení nebyly správně vyplněny.');

		// FIXME: Potentially unnecessary database call - refactor later
		const device = await db.query.measuringDevices.findFirst({
			where: eq(measuringDevices.id, form.data.deviceId)
		});

		if (device === undefined) {
			return error(404, { message: 'Měřící zařízení nenalezeno' });
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
			// Soft-deleting is the way to go, but let's first try hard delete to save on storage
			const deleteDevice = db
				.delete(measuringDevices)
				.where(eq(measuringDevices.id, form.data.deviceId));
			await db.batch([deleteDevice, touchOccupant()]);
		} catch (deletionError) {
			logger.error(
				{ deletionError },
				'Failed to delete measuring device, falling back to soft-delete'
			);
			// If we get here, it means the device has live relations, so we soft-delete instead
			if (isFailedForeignKeyConstraint(deletionError)) {
				const softDeleteDevice = db
					.update(measuringDevices)
					.set({ isDeleted: true, deleted: new Date() })
					.where(eq(measuringDevices.id, form.data.deviceId));
				await db.batch([softDeleteDevice, touchOccupant()]);
			} else {
				logger.error(
					{ deletionError },
					'Failed to delete measuring device but not due to foreign key constraint'
				);
				return error(500, { message: 'Nepodařilo se odstranit měřící zařízení' });
			}
		}

		return message(form, `Měřící zařízení ${form.data.name} bylo odstraněno.`);
	}
};
