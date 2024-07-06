import { listFmt } from '$lib/i18n/helpers';
import { energyTypes, labelsByEnergyType } from '$lib/models/common';
import { selectOccupantSchema } from '$lib/models/occupant';
import { z } from 'zod';

const energyTypeLabels = Object.values(labelsByEnergyType).map((x) => x.toLocaleLowerCase());

/**
 * Form schema for creating a measuring device
 */
export const addDeviceFormSchema = z.object({
	occupantId: selectOccupantSchema.shape.id,
	name: z
		.string()
		.min(1, 'Název měřícího zařízení je povinný')
		.max(280, 'Název měřícího zařízení nesmí být delší než 280 znaků')
		.trim()
		.default(''),
	energyType: z.enum(energyTypes, {
		// FIXME: This doesn't really work for some reason
		errorMap: () => ({
			message: `Energie musí být buď ${listFmt(energyTypeLabels, { type: 'disjunction' })}.`
		})
	})
});

export type AddDeviceForm = typeof addDeviceFormSchema;
