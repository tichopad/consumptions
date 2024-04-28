import { describe, it, expect } from 'vitest';
import { faker } from '@faker-js/faker/locale/cs_CZ';
import { calculateElectricityBills } from './calculate-electricity';
import type { Occupant } from '$lib/models/occupant';
import { id, type ID } from '$lib/models/common';
import type { MeasuringDevice } from '$lib/models/measuring-device';

describe('calculateElectricityBills', () => {
	it('calculates bills for renters only', () => {
		const buildingId = id();
		const billingPeriodId = id();
		const renterA = createRenter(buildingId, { name: 'Renter A', squareMeters: 10 });
		const renterB = createRenter(buildingId, { name: 'Renter B', squareMeters: 20 });
		const renterC = createRenter(buildingId, { name: 'Renter C', squareMeters: 50 });

		const result = calculateElectricityBills({
			buildingId,
			billingPeriodId,
			consumption: 1200,
			totalCost: 7200,
			dateRange: {
				start: new Date('2024-01-01T00:00:00Z'),
				end: new Date('2024-01-31T00:00:00Z')
			},
			occupants: [renterA, renterB, renterC]
		});

		expect(result.billsToInsert).not.toHaveLength(0);
		expect(result.consumptionRecordsToInsert).toHaveLength(0);
		// TODO: finish tests
	});
});

function createOccupant(buildingId: ID): Occupant {
	const now = new Date();
	return {
		id: id(),
		buildingId,
		chargedUnmeasuredElectricity: faker.datatype.boolean(),
		chargedUnmeasuredHeating: faker.datatype.boolean(),
		chargedUnmeasuredWater: faker.datatype.boolean(),
		name: faker.datatype.boolean() ? faker.company.name() : faker.person.fullName(),
		squareMeters: faker.number.int({ min: 10, max: 100 }),
		created: now,
		deleted: null,
		heatingFixedCostShare: faker.datatype.boolean()
			? faker.number.float({ min: 5, max: 500, fractionDigits: 2 })
			: null,
		isDeleted: false,
		updated: now
	};
}

type OccupantWithMeasuringDevices = Occupant & { measuringDevices: MeasuringDevice[] };

function createRenter(
	buildingId: ID,
	values: Partial<Occupant> = {}
): OccupantWithMeasuringDevices {
	const occupant = createOccupant(buildingId);
	occupant.chargedUnmeasuredElectricity = false;
	occupant.chargedUnmeasuredHeating = false;
	occupant.chargedUnmeasuredWater = false;
	occupant.heatingFixedCostShare = null;
	return { ...occupant, measuringDevices: [], ...values };
}
