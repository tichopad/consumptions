import { billingPeriods, selectBillingPeriodSchema } from '$lib/models/billing-period';
import { buildings } from '$lib/models/building';
import { energyBills, type EnergyBill } from '$lib/models/energy-bill';
import { occupants } from '$lib/models/occupant';
import { db } from '$lib/server/db/client';
import { error, type Load } from '@sveltejs/kit';
import { asc, eq, inArray } from 'drizzle-orm';

export const load: Load = async ({ params }) => {
	const parsed = selectBillingPeriodSchema.shape.id.safeParse(params.id);

	if (!parsed.success) {
		error(400, 'Missing or invalid billing period ID.');
	}

	const billingPeriod = await db.query.billingPeriods.findFirst({
		where: eq(billingPeriods.id, parsed.data),
		with: {
			energyBills: {
				with: {
					occupants: {
						columns: { id: true }
					}
				}
			}
		}
	});

	if (!billingPeriod) {
		error(404, 'Billing period not found.');
	}

	const occupantsIds = billingPeriod.energyBills.map((bill) => bill.occupantId).filter(Boolean);
	const occupantsIdsSet = new Set(occupantsIds);

	console.log(Array.from(occupantsIdsSet));

	const occupantsWithBills = await db.query.occupants.findMany({
		orderBy: asc(occupants.name),
		where: inArray(occupants.id, Array.from(occupantsIdsSet)),
		with: {
			energyBills: {
				where: eq(energyBills.billingPeriodId, billingPeriod.id)
			}
		}
	});

	console.log(occupantsWithBills);

	const buildingWithBills = await db.query.buildings.findFirst({
		where: eq(buildings.id, billingPeriod.buildingId),
		with: {
			energyBills: {
				where: eq(energyBills.billingPeriodId, billingPeriod.id)
			}
		}
	});

	let electricityBill: EnergyBill | undefined;
	let heatingBill: EnergyBill | undefined;
	let waterBill: EnergyBill | undefined;

	if (buildingWithBills?.energyBills !== undefined) {
		for (const bill of buildingWithBills.energyBills) {
			switch (bill.energyType) {
				case 'electricity': {
					electricityBill = bill;
					break;
				}
				case 'heating': {
					heatingBill = bill;
					break;
				}
				case 'water': {
					waterBill = bill;
					break;
				}
			}
		}
	}

	return {
		billingPeriod,
		buildingWithBills,
		occupantsWithBills,
		electricityBill,
		heatingBill,
		waterBill
	};
};
