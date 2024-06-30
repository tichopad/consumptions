import { numberFmt } from '$lib/i18n/helpers';
import { isEmptyStringTrimmed, isNullable } from '$lib/utils';
import BigNumber from 'bignumber.js';
import { z } from 'zod';

/**
 * Schema for the occupant creation form
 */
export const createOccupantFormSchema = z.object({
	name: z
		.string({
			coerce: true,
			invalid_type_error: 'Název musí být text',
			required_error: 'Název je povinný'
		})
		.min(1, 'Název musí být alespoň 1 znak dlouhý')
		.max(280, 'Název nesmí být delší než 280 znaků')
		.trim()
		.default(''),
	squareMeters: z
		.number({
			coerce: true,
			invalid_type_error: 'Výměra musí být číslo',
			required_error: 'Výměra je povinná'
		})
		.positive(`Výměra musí být větší než ${numberFmt(0)} m²`)
		.max(10000, `Výměra nesmí být větší než ${numberFmt(10000)} m²`)
		.transform((value) => new BigNumber(value).decimalPlaces(3).toNumber()),
	chargedUnmeasuredElectricity: z.boolean({
		coerce: true,
		// TODO:
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
	heatingFixedCostShare: z.preprocess(
		(value) => (isEmptyStringTrimmed(value) || isNullable(value) ? null : Number(value)),
		z
			.number({
				invalid_type_error: 'The heating fixed cost share coefficient has to be a number'
			})
			.gt(0, 'Fixed heating cost share has to be greater than 0')
			.max(781, `Fixed heating cost share cannot be greater than ${numberFmt(781)}`)
			.transform((value) => new BigNumber(value).decimalPlaces(3).toNumber())
			.nullable()
			.optional()
			.default(null)
	)
});

export type CreateOccupantForm = typeof createOccupantFormSchema;
