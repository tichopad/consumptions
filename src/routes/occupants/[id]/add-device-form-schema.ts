import { disjunctionListFmt } from '$lib/i18n/stores';
import { energyTypes, labelsByEnergyType } from '$lib/models/common';
import { selectOccupantSchema } from '$lib/models/occupant';
import { get } from 'svelte/store';
import { z } from 'zod';

const energyTypeLabels = Object.values(labelsByEnergyType).map((x) => x.toLocaleLowerCase());

/**
 * Form schema for updating a measuring device
 */
export const addDeviceFormSchema = z.object({
	occupantId: selectOccupantSchema.shape.id,
	name: z
		.string()
		.min(1, 'Device name has to be at least 1 character long')
		.max(280, 'Name cannot be more than 280 characters long')
		.trim()
		.default(''),
	energyType: z.enum(energyTypes, {
		errorMap: () => ({
			message: `Energy type has to be one of: ${get(disjunctionListFmt).format(energyTypeLabels)}`
		})
	})
});

export type AddDeviceForm = typeof addDeviceFormSchema;
