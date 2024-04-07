import { numberFmt } from '$lib/i18n/stores';
import { get } from 'svelte/store';
import { z } from 'zod';

/**
 * Schema for the occupant creation form
 */
export const createOccupantFormSchema = z.object({
	name: z
		.string({
			coerce: true,
			invalid_type_error: 'Name has to be a text',
			required_error: 'Name is required'
		})
		.min(1, 'Name has to be at least 1 character long')
		.max(280, 'Name cannot be more than 280 characters long')
		.trim()
		.default(''),
	squareMeters: z
		.number({
			coerce: true,
			invalid_type_error: 'Area must be a number',
			required_error: 'Area is required'
		})
		.positive(`Area must be greater than ${get(numberFmt).format(0)} m²`)
		.max(10000, `Area cannot be greater than ${get(numberFmt).format(10000)} m²`),
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
		.positive('Fixed heating cost share has to be greater than 0')
		.max(781, `Fixed heating cost share cannot be greater than ${get(numberFmt).format(781)}`)
		.optional()
});

export type CreateOccupantForm = typeof createOccupantFormSchema;
