import { selectOccupantSchema } from '$lib/models/occupant';
import { z } from 'zod';

/**
 * Form schema for deleting an occupant
 */
export const deleteOccupantFormSchema = z.object({
	occupantId: selectOccupantSchema.shape.id,
	// Need that name for a nice toast message
	name: selectOccupantSchema.shape.name
});

export type DeleteOccupantForm = typeof deleteOccupantFormSchema;
