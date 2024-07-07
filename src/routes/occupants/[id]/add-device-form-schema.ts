import { listFmt } from '$lib/i18n/helpers';
import { energyTypes, labelsByEnergyType, type EnergyType } from '$lib/models/common';
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
		.default('Hlavní měřič'),
	energyType: z
		.enum(energyTypes, {
			// This is the only way to set a custom error message with enum fields
			errorMap: () => ({
				message: `Typ energie musí být buď ${listFmt(energyTypeLabels, { type: 'disjunction' })}.`
			})
		})
		.default('' as EnergyType) // Default to unselected
});

export type AddDeviceForm = typeof addDeviceFormSchema;
