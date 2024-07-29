import type { PieChartData } from '$lib/common-types';
import { DEFAULT_LOCALE } from '$lib/i18n/helpers';
import { billingPeriods } from '$lib/models/billing-period';
import { db } from '$lib/server/db/client';
import type { Load } from '@sveltejs/kit';
import { desc } from 'drizzle-orm';

export const load: Load = async () => {
	const latestBilling = await db.query.billingPeriods.findFirst({
		orderBy: [desc(billingPeriods.created)],
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

	const nonZeroOccupantsBills = latestBilling?.energyBills.filter(
		(bill) => bill.occupants !== null && bill.totalCost > 0
	);

	const electricityChartData: PieChartData | undefined = nonZeroOccupantsBills
		?.filter((bill) => bill.energyType === 'electricity')
		.map((bill) => ({
			name: bill.occupants?.name ?? 'Neznámý',
			value: bill.totalCost
		}))
		.sort(sortChartDataByName);

	const waterChartData: PieChartData | undefined = nonZeroOccupantsBills
		?.filter((bill) => bill.energyType === 'water')
		.map((bill) => ({
			name: bill.occupants?.name ?? 'Neznámý',
			value: bill.totalCost
		}))
		.sort(sortChartDataByName);

	const heatingChartData: PieChartData | undefined = nonZeroOccupantsBills
		?.filter((bill) => bill.energyType === 'heating')
		.map((bill) => ({
			name: bill.occupants?.name ?? 'Neznámý',
			value: bill.totalCost
		}))
		.sort(sortChartDataByName);

	return {
		latestBilling,
		latestBuildingElectricityBill,
		latestBuildingHeatingBill,
		latestBuildingWaterBill,
		electricityChartData,
		waterChartData,
		heatingChartData
	};
};

type PieChartEntry = PieChartData[number];
function sortChartDataByName(a: PieChartEntry, b: PieChartEntry) {
	return a.name.localeCompare(b.name, DEFAULT_LOCALE, { numeric: true });
}
