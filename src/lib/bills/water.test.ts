import { id, type ConsumptionRecord, type Occupant } from '$lib/models/schema';
import { describe, expect, it } from 'vitest';
import { getWaterCostForOccupant } from './water';

// Helpers

const createOccupant = (o: Partial<Occupant> = {}) => ({
	id: id(),
	name: 'Karlach Cliffgate',
	chargedUnmeasuredElectricity: false,
	chargedUnmeasuredHeating: false,
	chargedUnmeasuredWater: true,
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

const costPerCubicMeter = 88;
const costPerSquareMeterOfArea = 3;

// Tests

describe('getWaterCostForOccupant', () => {
	it('calculates cost for a renter without consumption records', () => {
		const occupant = createOccupant({
			chargedUnmeasuredWater: true,
			squareMeters: 50
		});

		const cost = getWaterCostForOccupant(
			occupant,
			null,
			costPerCubicMeter,
			costPerSquareMeterOfArea
		);

		expect(cost).toBe(150);
	});

	it('calculates cost for a renter with consumption records', () => {
		const occupant = createOccupant({
			chargedUnmeasuredWater: true,
			squareMeters: 70
		});
		const records: ConsumptionRecord[] = [
			createConsumption({ consumption: 10 }),
			createConsumption({ consumption: 5.13 })
		];

		const cost = getWaterCostForOccupant(
			occupant,
			records,
			costPerCubicMeter,
			costPerSquareMeterOfArea
		);

		expect(cost).toBe(1541.44);
	});

	it('calculates cost for an owner with consumption records', () => {
		const occupant = createOccupant({ chargedUnmeasuredWater: false });
		const records: ConsumptionRecord[] = [createConsumption({ consumption: 123.41 })];

		const cost = getWaterCostForOccupant(
			occupant,
			records,
			costPerCubicMeter,
			costPerSquareMeterOfArea
		);

		expect(cost).toBe(10860.08);
	});

	it('throws if no records are given when calculating cost for owner', () => {
		const occupant = createOccupant({ chargedUnmeasuredWater: false });

		expect(() => {
			getWaterCostForOccupant(occupant, null, costPerCubicMeter, costPerSquareMeterOfArea);
		}).toThrowError();
	});
});
