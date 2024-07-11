import { logger } from '$lib/logger';
import { occupants, type OccupantInsert } from '$lib/models/occupant';
import { db } from '$lib/server/db/client';
import { error, redirect, type Actions, type Load } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { message, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { archiveOccupantFormSchema } from './archive-occupant-form-schema';
import { createOccupantFormSchema } from './create-edit-form-schema';

export const load: Load = async () => {
	const [createForm, archiveForm] = await Promise.all([
		superValidate(zod(createOccupantFormSchema)),
		superValidate(zod(archiveOccupantFormSchema))
	]);

	const unarchivedOccupants = await db.query.occupants.findMany({
		where: eq(occupants.isArchived, false)
	});
	const archivedOccupants = await db.query.occupants.findMany({
		where: eq(occupants.isArchived, true)
	});

	return {
		archiveForm,
		createForm,
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

		if (!form.valid) return message(form, 'Údaje subjektu nebyly správně vyplněny.');

		await db
			.update(occupants)
			.set({ isArchived: true, archived: new Date() })
			.where(eq(occupants.id, form.data.occupantId));

		return message(form, `Subjekt ${form.data.name} byl archivován.`);
	}
};
