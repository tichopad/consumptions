import { createOccupant, listBuildings } from '$lib/models';
import { redirect, type Load } from '@sveltejs/kit';
import type { Actions } from './$types';
import { z } from 'zod';

export const load: Load = () => {
	return {
		buildings: listBuildings()
	};
};

const schema = z.object({
	name: z.coerce.string(),
	squareMeters: z.coerce.number(),
	'chargedUnmeasuredShare.electricity': z.coerce.boolean().optional().default(false),
	'chargedUnmeasuredShare.water': z.coerce.boolean().optional().default(false),
	'chargedUnmeasuredShare.heating': z.coerce.boolean().optional().default(false),
	magicalConstant: z.coerce.number().optional(),
	building: z.coerce.string()
});

export const actions = {
	default: async (event) => {
		const formData = await event.request.formData();
		const data = Object.fromEntries(formData);

		console.log('Form data', data);

		const safeData = schema.parse(data);

		const occupant = createOccupant({
			name: safeData.name,
			squareMeters: safeData.squareMeters,
			chargedUnmeasuredShare: {
				electricity: safeData['chargedUnmeasuredShare.electricity'],
				water: safeData['chargedUnmeasuredShare.water'],
				heating: safeData['chargedUnmeasuredShare.heating']
			},
			magicalConstant: safeData.magicalConstant
		});

		console.log('Created occupant', occupant);

		return redirect(302, `/occupant/${occupant.id}`);
	}
} satisfies Actions;
