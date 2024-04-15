import { selectMeasuringDeviceSchema } from '$lib/models/measuring-device';
import { z } from 'zod';

/**
 * Form schema for updating a measuring device
 */
export const editDeviceFormSchema = z.object({
	id: selectMeasuringDeviceSchema.shape.id,
	name: z
		.string()
		.min(1, 'Device name has to be at least 1 character long')
		.max(280, 'Name cannot be more than 280 characters long')
		.trim()
		.default('')
});

export type EditDeviceForm = typeof editDeviceFormSchema;
