import { logger } from '$lib/logger';
import { occupants, type OccupantInsert } from '$lib/models/occupant';
import { db } from '$lib/server/db/client';
import { isFailedForeignKeyConstraint } from '$lib/server/db/helpers';
import { error, redirect, type Actions, type Load } from '@sveltejs/kit';
import { and, asc, eq, sql } from 'drizzle-orm';
import { message, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { archiveOccupantFormSchema } from './archive-occupant-form-schema';
import { createOccupantFormSchema } from './create-edit-form-schema';
import { deleteOccupantFormSchema } from './delete-occupant-form-schema';

export const load: Load = async () => {
	const [createForm, archiveForm, deleteForm] = await Promise.all([
		superValidate(zod(createOccupantFormSchema)),
		// See https://superforms.rocks/concepts/multiple-forms
		superValidate(zod(archiveOccupantFormSchema), { id: 'archiveForm' }),
		superValidate(zod(deleteOccupantFormSchema), { id: 'deleteForm' })
	]);

	const unarchivedOccupants = await db.query.occupants.findMany({
		where: and(eq(occupants.isArchived, false), eq(occupants.isDeleted, false)),
		orderBy: asc(sql`lower(${occupants.name})`)
	});
	const archivedOccupants = await db.query.occupants.findMany({
		where: and(eq(occupants.isArchived, true), eq(occupants.isDeleted, false)),
		orderBy: asc(sql`lower(${occupants.name})`)
	});

	return {
		archiveForm,
		createForm,
		deleteForm,
		archivedOccupants,
		unarchivedOccupants
	};
};

export const actions: Actions = {
	/**
	 * Handles occupant creation
	 */
	createOccupant: async (event) => {
		const form = await superValidate(event, zod(createOccupantFormSchema));

		if (!form.valid) {
			logger.info({ form }, 'Failed createOccupant form validation');
			return message(form, 'Údaje subjektu nebyly správně vyplněny.');
		}

		const defaultBuilding = await db.query.buildings.findFirst();

		if (defaultBuilding === undefined) {
			logger.error({ defaultBuilding }, 'Failed to find default building');
			return error(404, { message: 'Výchozí budova pro subjekt nenalezena' });
		}

		const occupantInsertValues: OccupantInsert = {
			...form.data,
			buildingId: defaultBuilding.id
		};
		const [createdOccupant] = await db.insert(occupants).values(occupantInsertValues).returning();

		if (createdOccupant === undefined) {
			logger.error({ occupantInsertValues }, 'Failed to insert occupant');
			return error(500, { message: 'Nepodařilo se vložit subjekt do databáze' });
		}

		return redirect(304, `/occupants/${createdOccupant.id}`);
	},
	/**
	 * Handles deleting measuring device
	 */
	archiveOccupant: async (event) => {
		const form = await superValidate(event, zod(archiveOccupantFormSchema));

		if (!form.valid) {
			logger.info({ form }, 'Failed archiveOccupant form validation');
			return message(form, 'Údaje subjektu nebyly správně vyplněny.');
		}

		await db
			.update(occupants)
			.set({ isArchived: true, archived: new Date() })
			.where(eq(occupants.id, form.data.occupantId));

		logger.info({ occupantId: form.data.occupantId }, 'Archived occupant');

		return message(form, `Subjekt ${form.data.name} byl archivován.`);
	},
	/**
	 * Handles deleting an occupant
	 */
	deleteOccupant: async (event) => {
		const form = await superValidate(event, zod(deleteOccupantFormSchema));

		if (!form.valid) {
			logger.info({ form }, 'Failed deleteOccupant form validation');
			return message(form, 'Údaje subjektu nebyly správně vyplněny.');
		}

		try {
			// Soft-deleting is the way to go, but let's first try hard delete to save on storage
			await db.delete(occupants).where(eq(occupants.id, form.data.occupantId));
			logger.info({ occupantId: form.data.occupantId }, 'Hard-deleted occupant');
		} catch (deletionError) {
			logger.error({ deletionError }, 'Failed to delete an occupant, falling back to soft-delete');
			// If we get here, it means the device has live relations, so we soft-delete instead
			if (isFailedForeignKeyConstraint(deletionError)) {
				await db
					.update(occupants)
					.set({ isDeleted: true, deleted: new Date() })
					.where(eq(occupants.id, form.data.occupantId));
				logger.info({ occupantId: form.data.occupantId }, 'Soft-deleted occupant');
			} else {
				logger.error(
					{ deletionError },
					'Failed to delete an occupant but not due to foreign key constraint'
				);
				return error(500, { message: 'Nepodařilo se odstranit subjekt' });
			}
		}

		return message(form, `Subjekt ${form.data.name} byl odstraněn.`);
	}
};
