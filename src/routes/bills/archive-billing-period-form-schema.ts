import { selectBillingPeriodSchema } from '$lib/models/billing-period';
import { z } from 'zod';

/**
 * Form schema for archiving an billingPeriod
 */
export const archiveBillingPeriodFormSchema = z.object({
	billingPeriodId: selectBillingPeriodSchema.shape.id,
	// Need that start and end date for a nice toast message
	startDate: selectBillingPeriodSchema.shape.startDate,
	endDate: selectBillingPeriodSchema.shape.endDate
});

export type ArchiveBillingPeriodForm = typeof archiveBillingPeriodFormSchema;
