import { billingPeriods, selectBillingPeriodSchema } from '$lib/models/billing-period';
import { energyBills, type EnergyBill } from '$lib/models/energy-bill';
import { occupants } from '$lib/models/occupant';
import { db } from '$lib/server/db/client';
import { error, type Load } from '@sveltejs/kit';
import { asc, eq, inArray } from 'drizzle-orm';

export const load: Load = async ({ params }) => {
	const parsedId = selectBillingPeriodSchema.shape.id.safeParse(params.id);

	if (!parsedId.success) {
		error(400, 'Chybějící nebo neplatné ID vyúčtování.');
	}

	const billingPeriod = await db.query.billingPeriods.findFirst({
		where: eq(billingPeriods.id, parsedId.data),
		with: {
			energyBills: {
				with: {
					occupants: {
						columns: { id: true }
					},
					buildings: true
				}
			}
		}
	});

	if (!billingPeriod) {
		error(404, 'Vyúčtování nenalezeno.');
	}

	const occupantsIds = billingPeriod.energyBills.map((bill) => bill.occupantId).filter(Boolean);
	const occupantsIdsSet = new Set(occupantsIds);

	const occupantsWithBills = await db.query.occupants.findMany({
		orderBy: asc(occupants.name),
		where: inArray(occupants.id, Array.from(occupantsIdsSet)),
		with: {
			energyBills: {
				where: eq(energyBills.billingPeriodId, billingPeriod.id)
			}
		}
	});

	let electricityBill: EnergyBill | undefined;
	let heatingBill: EnergyBill | undefined;
	let waterBill: EnergyBill | undefined;

	for (const bill of billingPeriod.energyBills) {
		if (bill.buildingId === null) continue;
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

	const billWithBuilding = billingPeriod.energyBills.find((bill) => bill.buildings !== null);

	const occupiedArea = occupantsWithBills.reduce((acc, occupant) => acc + occupant.squareMeters, 0);

	return {
		billingPeriod,
		building: billWithBuilding?.buildings ?? null,
		occupiedArea,
		occupantsWithBills,
		electricityBill,
		heatingBill,
		waterBill
	};
};
