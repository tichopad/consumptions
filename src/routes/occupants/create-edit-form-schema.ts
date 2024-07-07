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
		.min(1, 'Název je povinný')
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
			'Musí být zadáno, zda je subjektu účtována spotřeba elektřiny na základě jeho výměry',
		required_error: 'Tato hodnota může být pouze ano nebo ne'
	}),
	chargedUnmeasuredWater: z.boolean({
		coerce: true,
		invalid_type_error:
			'Musí být zadáno, zda je subjektu účtována spotřeba vody na základě jeho výměry',
		required_error: 'Tato hodnota může být pouze ano nebo ne'
	}),
	chargedUnmeasuredHeating: z.boolean({
		coerce: true,
		invalid_type_error:
			'Musí být zadáno, zda je subjektu účtována spotřeba tepla na základě jeho výměry',
		required_error: 'Tato hodnota může být pouze ano nebo ne'
	}),
	heatingFixedCostShare: z.preprocess(
		(value) => (isEmptyStringTrimmed(value) || isNullable(value) ? null : Number(value)),
		z
			.number({
				invalid_type_error: 'Hodnota podílu na fixním nákladu tepla musí být číslo'
			})
			.gt(0, 'Podíl na fixním nákladu tepla musí být větší než 0')
			.transform((value) => new BigNumber(value).decimalPlaces(3).toNumber())
			.nullable()
			.optional()
			.default(null)
	)
});

export type CreateOccupantForm = typeof createOccupantFormSchema;
