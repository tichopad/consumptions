import { selectBillingPeriodSchema } from '$lib/models/billing-period';
import { z } from 'zod';

/**
 * Form schema for restoring a billing period
 */
export const restoreBillingPeriodFormSchema = z.object({
	billingPeriodId: selectBillingPeriodSchema.shape.id,
	// Need that start and end date for a nice toast message
	startDate: selectBillingPeriodSchema.shape.startDate,
	endDate: selectBillingPeriodSchema.shape.endDate
});

export type RestoreBillingPeriodForm = typeof restoreBillingPeriodFormSchema;
