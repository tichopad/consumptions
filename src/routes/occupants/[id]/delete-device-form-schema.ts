import { selectMeasuringDeviceSchema } from '$lib/models/measuring-device';
import { z } from 'zod';

/**
 * Form schema for deleting a measuring device
 */
export const deleteDeviceFormSchema = z.object({
	deviceId: selectMeasuringDeviceSchema.shape.id,
	// Need that name for a nice toast message
	name: selectMeasuringDeviceSchema.shape.name
});

export type DeleteDeviceForm = typeof deleteDeviceFormSchema;
