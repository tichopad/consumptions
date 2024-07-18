import { selectOccupantSchema } from '$lib/models/occupant';
import { z } from 'zod';

/**
 * Form schema for restoring an archived occupant
 */
export const restoreOccupantFormSchema = z.object({
	occupantId: selectOccupantSchema.shape.id,
	// Need that name for a nice toast message
	name: selectOccupantSchema.shape.name
});

export type RestoreOccupantForm = typeof restoreOccupantFormSchema;
