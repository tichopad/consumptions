import { selectMeasuringDeviceSchema } from '$lib/models/measuring-device';
import { z } from 'zod';

/**
 * Form schema for updating a measuring device
 */
export const editDeviceFormSchema = z.object({
	id: selectMeasuringDeviceSchema.shape.id,
	name: z
		.string()
		.min(1, 'Název měřícího zařízení musí být alespoň 1 znak dlouhý')
		.max(280, 'Název měřícího zařízení nesmí být delší než 280 znaků')
		.trim()
		.default('')
});

export type EditDeviceForm = typeof editDeviceFormSchema;
