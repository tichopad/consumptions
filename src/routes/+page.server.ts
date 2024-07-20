import { billingPeriods } from '$lib/models/billing-period';
import { db } from '$lib/server/db/client';
import type { Load } from '@sveltejs/kit';
import { desc } from 'drizzle-orm';

export const load: Load = async () => {
	const latestBilling = await db.query.billingPeriods.findFirst({
		orderBy: [desc(billingPeriods.endDate), desc(billingPeriods.startDate)],
		with: {
			energyBills: {
				with: {
					occupants: true
				}
			}
		}
	});

	const latestBuildingElectricityBill = latestBilling?.energyBills.find(
		(bill) => bill.buildingId !== null && bill.energyType === 'electricity'
	);
	const latestBuildingHeatingBill = latestBilling?.energyBills.find(
		(bill) => bill.buildingId !== null && bill.energyType === 'heating'
	);
	const latestBuildingWaterBill = latestBilling?.energyBills.find(
		(bill) => bill.buildingId !== null && bill.energyType === 'water'
	);

	return {
		latestBilling,
		latestBuildingElectricityBill,
		latestBuildingHeatingBill,
		latestBuildingWaterBill
	};
};
