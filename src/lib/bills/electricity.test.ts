import { id, type ConsumptionRecord, type Occupant } from '$lib/models/schema';
import { describe, expect, it } from 'vitest';
import { getElectricityCostForOccupant } from './electricity';

// Helpers

const createOccupant = (o: Partial<Occupant> = {}) => ({
	id: id(),
	name: 'Karlach Cliffgate',
	chargedUnmeasuredElectricity: true,
	chargedUnmeasuredHeating: false,
	chargedUnmeasuredWater: false,
	squareMeters: 40,
	buildingId: id(),
	heatingFixedCostShare: null,
	...o
});

const createConsumption = (c: Partial<ConsumptionRecord> = {}) => ({
	id: id(),
	startDate: new Date('2021-01-01'),
	endDate: new Date('2021-01-31'),
	measuringDeviceId: id(),
	consumption: 100,
	...c
});

// Tests

describe('getElectricityCostForOccupant', () => {
	it('calculates cost for a renter without consumption records', () => {
		const occupant = createOccupant();
		const costPerKwh = 6;
		const costPerSquareMeter = 2.5;

		const cost = getElectricityCostForOccupant(occupant, null, costPerKwh, costPerSquareMeter);

		expect(cost).toBe(100);
	});

	it('calculates cost for a renter with consumption records', () => {
		const occupant = createOccupant();
		const costPerKwh = 6;
		const costPerSquareMeter = 2.5;
		const records: ConsumptionRecord[] = [
			createConsumption({ consumption: 100 }),
			createConsumption({ consumption: 200 })
		];

		const cost = getElectricityCostForOccupant(occupant, records, costPerKwh, costPerSquareMeter);

		expect(cost).toBe(1900);
	});

	it('calculates cost for an owner with consumption records', () => {
		const occupant = createOccupant({ chargedUnmeasuredElectricity: false });

		const costPerKwh = 6;
		const costPerSquareMeter = 2.5;
		const records: ConsumptionRecord[] = [createConsumption({ consumption: 100 })];

		const cost = getElectricityCostForOccupant(occupant, records, costPerKwh, costPerSquareMeter);

		expect(cost).toBe(600);
	});

	it('throws if no records are given when calculating cost for owner', () => {
		const occupant = createOccupant({ chargedUnmeasuredElectricity: false });
		const costPerKwh = 6;
		const costPerSquareMeter = 2.5;

		expect(() => {
			getElectricityCostForOccupant(occupant, null, costPerKwh, costPerSquareMeter);
		}).toThrowError();
	});
});
