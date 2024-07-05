import { occupants, type OccupantInsert } from '$lib/models/occupant';
import { db } from '$lib/server/db/client';
import { fail, redirect, type Actions, type Load } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
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

		console.log(form);

		if (!form.valid) return fail(400, { form });

		const defaultBuilding = await db.query.buildings.findFirst();

		if (defaultBuilding === undefined) {
			return fail(500, { form, message: 'Výchozí budova nenalezena' });
		}

		const occupantInsertValues: OccupantInsert = {
			...form.data,
			buildingId: defaultBuilding.id
		};
		const [createdOccupant] = await db.insert(occupants).values(occupantInsertValues).returning();

		if (createdOccupant === undefined) {
			return fail(500, { form, message: 'Nepodařilo se vložit subjekt do databáze' });
		}

		return redirect(304, `/occupants/${createdOccupant.id}`);
	}
};
