import { db } from '$lib/server/db/client';
import { buildings, insertBuildingSchema } from '$lib/models/schema';
import { redirect, type Actions } from '@sveltejs/kit';

export const actions = {
	default: async (event) => {
		const formDataEntries = await event.request.formData();
		const formData = Object.fromEntries(formDataEntries);

		const parsed = insertBuildingSchema.safeParse(formData);

		if (!parsed.success) {
			return {
				status: 400,
				body: parsed.error.errors
			};
		}

		const [building] = await db.insert(buildings).values(parsed.data).returning();

		console.log('Created building', building);

		return redirect(302, `/buildings/${building.id}`);
	}
} satisfies Actions;
