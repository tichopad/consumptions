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
		.min(1, 'Device name has to be at least 1 character long')
		.max(280, 'Name cannot be more than 280 characters long')
		.trim()
		.default(''),
	energyType: z.enum(energyTypes, {
		// FIXME: This doesn't really work for some reason
		errorMap: () => ({
			message: `Energy type has to be one of: ${listFmt(energyTypeLabels, { type: 'disjunction' })}`
		})
	})
});

export type AddDeviceForm = typeof addDeviceFormSchema;
