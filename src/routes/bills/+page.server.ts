import { billingPeriods } from '$lib/models/schema';
import { db } from '$lib/server/db/client';
import { type Load } from '@sveltejs/kit';
import { desc } from 'drizzle-orm';

export const load: Load = async () => {
	const allBillingPeriods = await db.query.billingPeriods.findMany({
		orderBy: [desc(billingPeriods.endDate), desc(billingPeriods.startDate)],
		with: {
			energyBills: true
		}
	});

	return { allBillingPeriods };
};
