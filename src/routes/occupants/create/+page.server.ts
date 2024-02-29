import { db } from '$lib/server/db/client';
import { insertOccupantSchema, occupants } from '$lib/models/schema';
import { redirect, type Load } from '@sveltejs/kit';
import type { Actions } from './$types';

export const load: Load = async () => {
	return {
		buildings: await db.query.buildings.findMany()
	};
};

export const actions = {
	default: async (event) => {
		const formDataEntries = await event.request.formData();
		const formData = Object.fromEntries(formDataEntries);

		console.log('Form data', formData);

		const parsed = insertOccupantSchema.safeParse(formData); //FIXME: these fields need to be coerced

		if (!parsed.success) {
			console.log('Invalid data', parsed.error);
			return {
				status: 400,
				body: parsed.error.errors
			};
		}

		const [occupant] = await db.insert(occupants).values(parsed.data).returning();

		console.log('Created occupant', occupant);

		return redirect(302, `/occupant/${occupant.id}`);
	}
} satisfies Actions;
