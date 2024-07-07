import { logger } from '$lib/logger';
import { occupants, type OccupantInsert } from '$lib/models/occupant';
import { db } from '$lib/server/db/client';
import { error, redirect, type Actions, type Load } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { createOccupantFormSchema } from './create-edit-form-schema';

export const load: Load = async () => {
	const form = await superValidate(zod(createOccupantFormSchema));
	const occupants = await db.query.occupants.findMany();

	return {
		form,
		occupants
	};
};

export const actions: Actions = {
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
	}
};
