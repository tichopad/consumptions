import { selectBillingPeriodSchema } from '$lib/models/billing-period';
import { z } from 'zod';

/**
 * Form schema for deleting a billing period
 */
export const deleteBillingPeriodFormSchema = z.object({
	billingPeriodId: selectBillingPeriodSchema.shape.id,
	// Need that start and end date for a nice toast message
	startDate: selectBillingPeriodSchema.shape.startDate,
	endDate: selectBillingPeriodSchema.shape.endDate
});

export type DeleteBillingPeriodForm = typeof deleteBillingPeriodFormSchema;
