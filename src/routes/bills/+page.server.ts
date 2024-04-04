import { billingPeriods, type ID } from '$lib/models/schema';
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

	// FIXME: cache this on the DB record?
	const totalCosts = new Map<ID, { electricity: number; heating: number; water: number }>();

	for (const billingPeriod of allBillingPeriods) {
		let totalElectricityCost = 0;
		let totalHeatingCost = 0;
		let totalWaterCost = 0;

		for (const bill of billingPeriod.energyBills) {
			switch (bill.energyType) {
				case 'electricity': {
					totalElectricityCost += bill.totalCost;
					break;
				}
				case 'heating': {
					totalHeatingCost += bill.totalCost;
					break;
				}
				case 'water': {
					totalWaterCost += bill.totalCost;
					break;
				}
			}
		}

		totalCosts.set(billingPeriod.id, {
			electricity: totalElectricityCost,
			heating: totalHeatingCost,
			water: totalWaterCost
		});
	}

	return { allBillingPeriods, totalCosts };
};
