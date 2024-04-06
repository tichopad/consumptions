import { db } from '$lib/server/db/client';
import { fail, type Actions, type Load } from '@sveltejs/kit';
import { z } from 'zod';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';

const createOccupantFormSchema = z.object({
	name: z
		.string({
			coerce: true,
			invalid_type_error: 'Name has to be a text',
			required_error: 'Name is required'
		})
		.min(2)
		.max(280)
		.trim(),
	squareMeters: z
		.number({
			coerce: true,
			invalid_type_error: 'Area must be a number',
			required_error: 'Area is required'
		})
		.positive()
		.finite()
		.safe(),
	chargedUnmeasuredElectricity: z.boolean({
		coerce: true,
		invalid_type_error:
			'Whether the occupant is charged for electricity consumption based on their area has to be specified',
		required_error: 'Has to either be true or false'
	}),
	chargedUnmeasuredWater: z.boolean({
		coerce: true,
		invalid_type_error:
			'Whether the occupant is charged for water consumption based on their area has to be specified',
		required_error: 'Has to either be true or false'
	}),
	chargedUnmeasuredHeating: z.boolean({
		coerce: true,
		invalid_type_error:
			'Whether the occupant is charged for heating consumption based on their area has to be specified',
		required_error: 'Has to either be true or false'
	}),
	heatingFixedCostShare: z
		.number({
			coerce: true,
			invalid_type_error: 'The heating fixed cost share coefficient has to be a number'
		})
		.positive()
		.finite()
		.safe()
		.optional()
});

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

		console.log(JSON.stringify(form.data, null, 2));
	}
};
