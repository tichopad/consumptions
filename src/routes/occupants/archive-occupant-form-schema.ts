import { selectOccupantSchema } from '$lib/models/occupant';
import { z } from 'zod';

/**
 * Form schema for archiving an occupant
 */
export const archiveOccupantFormSchema = z.object({
	occupantId: selectOccupantSchema.shape.id,
	// Need that name for a nice toast message
	name: selectOccupantSchema.shape.name
});

export type ArchiveOccupantForm = typeof archiveOccupantFormSchema;
