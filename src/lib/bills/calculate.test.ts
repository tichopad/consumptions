import { type EnergyType, type ID } from '$lib/models/common';
import type { Occupant } from '$lib/models/occupant';
import { assertSuccess, sumPreciseBy } from '$lib/utils';
import { assert, describe, expect, test } from 'vitest';
import { CalculationInputError, calculateBills } from './calculate';
import type { MeasuringDeviceConsumption, OccupantCalculationEntry } from './calculation-types';

describe('calculateBills', () => {
	// -- Context --

	const buildingId = 'building_1' as ID;
	const billingPeriodId = 'billing_period_1' as ID;

	const renterA = makeRenter('renterA', buildingId, { squareMeters: 10 });
	const renterB = makeRenter('renterB', buildingId, { squareMeters: 20 });

	const rentersElectricityConsumption = makeMeasurement('renterWithDevice', 'electricity', 100);
	const renterWithDevice = makeRenter('renterWithDevice', buildingId, {
		squareMeters: 30,
		measuringDevices: [rentersElectricityConsumption]
	});

	const ownerAWaterConsumption = makeMeasurement('ownerA', 'water', 2);
	const ownerAElectricityConsumption = makeMeasurement('ownerA', 'electricity', 50.55);
	const ownerAHeatingConsumption = makeMeasurement('ownerA', 'heating', 10);
	const ownerA = makeOwner('ownerA', buildingId, {
		squareMeters: 20,
		measuringDevices: [
			ownerAElectricityConsumption,
			ownerAHeatingConsumption,
			ownerAWaterConsumption
		]
	});

	const ownerBWaterConsumption = makeMeasurement('ownerB', 'water', 3);
	const ownerBElectricityConsumption = makeMeasurement('ownerB', 'electricity', 75.12);
	const ownerBHeatingConsumption = makeMeasurement('ownerB', 'heating', 5);
	const ownerB = makeOwner('ownerB', buildingId, {
		heatingFixedCostShare: 10,
		measuringDevices: [
			ownerBElectricityConsumption,
			ownerBHeatingConsumption,
			ownerBWaterConsumption
		]
	});

	// -- Tests --

	test('calculates bills for renters only', () => {
		const result = calculateBills({
			buildingId,
			billingPeriodId,
			energyType: 'electricity',
			totalConsumption: 1200,
			totalCost: 7200,
			dateRange: {
				start: new Date('2024-01-01T00:00:00Z'),
				end: new Date('2024-01-31T00:00:00Z')
			},
			occupants: [renterA, renterB]
		});

		assert(result.success === true, 'Calculation failed');
		const { billsToInsert, consumptionRecordsToInsert } = result.value;

		expect(result.value).toMatchSnapshot();

		// Association to occupant and building is mutually exclusive
		for (const bill of billsToInsert) {
			if (bill.occupantId) expect(bill.buildingId).toBeFalsy();
			else if (bill.buildingId) expect(bill.occupantId).toBeFalsy();
		}

		// There shouldn't be any consumption records
		expect(consumptionRecordsToInsert).toHaveLength(0);
	});

	test('calculates bills for renters with measuring devices', () => {
		const result = calculateBills({
			buildingId,
			billingPeriodId,
			energyType: 'electricity',
			totalConsumption: 1200,
			totalCost: 7200,
			dateRange: {
				start: new Date('2024-01-01T00:00:00Z'),
				end: new Date('2024-01-31T00:00:00Z')
			},
			occupants: [renterA, renterB, renterWithDevice]
		});

		assert(result.success === true, 'Calculation failed');
		expect(result.value).toMatchSnapshot();
	});

	test('calculates bills for renters, renters with measuring devices and owners', () => {
		const result = calculateBills({
			billingPeriodId,
			buildingId,
			energyType: 'electricity',
			totalConsumption: 1500,
			totalCost: 9000,
			dateRange: {
				start: new Date('2024-01-01T00:00:00Z'),
				end: new Date('2024-01-31T00:00:00Z')
			},
			occupants: [renterA, renterB, renterWithDevice, ownerA, ownerB]
		});

		assert(result.success === true, 'Calculation failed');
		expect(result.value).toMatchSnapshot();
	});

	test('calculated bills equal the input total cost', () => {
		const electricityResult = calculateBills({
			billingPeriodId,
			buildingId,
			energyType: 'electricity',
			totalConsumption: 1500,
			totalCost: 9000,
			dateRange: {
				start: new Date('2024-01-01T00:00:00Z'),
				end: new Date('2024-01-31T00:00:00Z')
			},
			occupants: [renterA, renterWithDevice, ownerA, ownerB]
		});
		const waterResult = calculateBills({
			billingPeriodId,
			buildingId,
			energyType: 'water',
			totalConsumption: 10,
			totalCost: 1000,
			dateRange: {
				start: new Date('2024-01-01T00:00:00Z'),
				end: new Date('2024-01-31T00:00:00Z')
			},
			occupants: [renterA, renterWithDevice, ownerA, ownerB]
		});

		assert(electricityResult.success);
		assert(waterResult.success);

		const occupantsElectricityBills = electricityResult.value.billsToInsert.filter(
			(b) => !b.buildingId
		);
		const occupantsElectricityBillsSum = sumPreciseBy(
			occupantsElectricityBills,
			(b) => b.totalCost
		);
		expect(occupantsElectricityBillsSum.toNumber()).toBeCloseTo(9000, 0.1);

		const occupantsWaterBills = waterResult.value.billsToInsert.filter((b) => !b.buildingId);
		const occupantsWaterBillsSum = sumPreciseBy(occupantsWaterBills, (b) => b.totalCost);
		expect(occupantsWaterBillsSum.toNumber()).toBeCloseTo(1000, 0.1);
	});

	test('returns zero cost per square meter when there are no renters', () => {
		const result = calculateBills({
			billingPeriodId,
			buildingId,
			energyType: 'electricity',
			totalConsumption: 125.67,
			totalCost: 754.02,
			dateRange: {
				start: new Date('2024-01-01T00:00:00Z'),
				end: new Date('2024-01-31T00:00:00Z')
			},
			occupants: [ownerA, ownerB]
		});

		assert(result.success);

		const buildingBill = result.value.billsToInsert.find((b) => b.buildingId === buildingId);

		expect(buildingBill?.costPerSquareMeter).toBe(0);
	});

	test('fails given no occupants', () => {
		const result = calculateBills({
			billingPeriodId,
			buildingId,
			energyType: 'electricity',
			totalConsumption: 1500,
			totalCost: 9000,
			dateRange: {
				start: new Date('2024-01-01T00:00:00Z'),
				end: new Date('2024-01-31T00:00:00Z')
			},
			occupants: []
		});
		assert(result.success === false);
		expect(result.error).toBeInstanceOf(CalculationInputError);
	});

	test('fails given invalid total consumption', () => {
		const zeroResult = calculateBills({
			billingPeriodId,
			buildingId,
			energyType: 'electricity',
			totalConsumption: -420,
			totalCost: 9000,
			dateRange: {
				start: new Date('2024-01-01T00:00:00Z'),
				end: new Date('2024-01-31T00:00:00Z')
			},
			occupants: [renterA]
		});
		assert(zeroResult.success === false);
		expect(zeroResult.error).toBeInstanceOf(CalculationInputError);

		const negativeResult = calculateBills({
			billingPeriodId,
			buildingId,
			energyType: 'electricity',
			totalConsumption: -1000,
			totalCost: 9000,
			dateRange: {
				start: new Date('2024-01-01T00:00:00Z'),
				end: new Date('2024-01-31T00:00:00Z')
			},
			occupants: [renterA]
		});
		assert(negativeResult.success === false);
		expect(negativeResult.error).toBeInstanceOf(CalculationInputError);
	});

	test('fails given invalid total cost', () => {
		const zeroResult = calculateBills({
			billingPeriodId,
			buildingId,
			energyType: 'electricity',
			totalConsumption: 1000,
			totalCost: 0,
			dateRange: {
				start: new Date('2024-01-01T00:00:00Z'),
				end: new Date('2024-01-31T00:00:00Z')
			},
			occupants: [renterA]
		});
		assert(zeroResult.success === false);
		expect(zeroResult.error).toBeInstanceOf(CalculationInputError);

		const negativeResult = calculateBills({
			billingPeriodId,
			buildingId,
			energyType: 'electricity',
			totalConsumption: 1000,
			totalCost: -9000,
			dateRange: {
				start: new Date('2024-01-01T00:00:00Z'),
				end: new Date('2024-01-31T00:00:00Z')
			},
			occupants: [renterA]
		});
		assert(negativeResult.success === false);
		expect(negativeResult.error).toBeInstanceOf(CalculationInputError);
	});

	test('fails given invalid fixed cost', () => {
		const result = calculateBills({
			billingPeriodId,
			buildingId,
			energyType: 'heating',
			fixedCost: -1000,
			totalConsumption: 95,
			totalCost: 42500,
			dateRange: {
				start: new Date('2024-01-01T00:00:00Z'),
				end: new Date('2024-01-31T00:00:00Z')
			},
			occupants: [renterA]
		});
		assert(result.success === false);
		expect(result.error).toBeInstanceOf(CalculationInputError);
	});

	test('fails given fixed cost and other energy type than "heating"', () => {
		const waterResult = calculateBills({
			billingPeriodId,
			buildingId,
			energyType: 'water',
			fixedCost: 5000,
			totalConsumption: 95,
			totalCost: 42500,
			dateRange: {
				start: new Date('2024-01-01T00:00:00Z'),
				end: new Date('2024-01-31T00:00:00Z')
			},
			occupants: [renterA]
		});
		assert(waterResult.success === false);
		expect(waterResult.error).toBeInstanceOf(CalculationInputError);

		const electricityResult = calculateBills({
			billingPeriodId,
			buildingId,
			energyType: 'electricity',
			fixedCost: 5000,
			totalConsumption: 95,
			totalCost: 42500,
			dateRange: {
				start: new Date('2024-01-01T00:00:00Z'),
				end: new Date('2024-01-31T00:00:00Z')
			},
			occupants: [renterA]
		});
		assert(electricityResult.success === false);
		expect(electricityResult.error).toBeInstanceOf(CalculationInputError);
	});

	test('handles zero total consumption', () => {
		const result = calculateBills({
			billingPeriodId,
			buildingId,
			energyType: 'heating',
			totalConsumption: 0,
			totalCost: 9000,
			dateRange: {
				start: new Date('2024-01-01T00:00:00Z'),
				end: new Date('2024-01-31T00:00:00Z')
			},
			occupants: [renterA]
		});
		assertSuccess(result);
		expect(result.value).toMatchSnapshot();
	});

	test.concurrent('correctly splits fixed cost', () => {
		const bId = 'building_1' as ID;
		const occupant1 = makeOwner('occupant1', bId, {
			heatingFixedCostShare: 10,
			measuringDevices: [makeMeasurement('occupant1', 'heating', 10)]
		});
		const occupant2 = makeOwner('occupant2', bId, {
			measuringDevices: [makeMeasurement('occupant2', 'heating', 20)]
		});
		const occupant3 = makeOwner('occupant3', bId, {
			chargedUnmeasuredHeating: true,
			squareMeters: 10,
			measuringDevices: []
		});
		const result = calculateBills({
			billingPeriodId,
			buildingId,
			energyType: 'heating',
			totalConsumption: 50,
			totalCost: 40000,
			fixedCost: 20000,
			dateRange: {
				start: new Date('2024-01-01T00:00:00Z'),
				end: new Date('2024-01-31T00:00:00Z')
			},
			occupants: [occupant1, occupant2, occupant3]
		});
		assertSuccess(result);

		const occupant1Bill = result.value.billsToInsert.find((b) => b.occupantId === occupant1.id);
		expect(occupant1Bill?.costPerUnit).toBe(400);
		expect(occupant1Bill?.totalCost).toBe(24000);
		expect(occupant1Bill?.fixedCost).toBe(20000);
		expect(occupant1Bill?.measuredCost).toBe(4000);

		const occupant2Bill = result.value.billsToInsert.find((b) => b.occupantId === occupant2.id);
		expect(occupant2Bill?.costPerUnit).toBe(400);
		expect(occupant2Bill?.totalCost).toBe(8000);
		expect(occupant2Bill?.fixedCost).toBeUndefined();
		expect(occupant2Bill?.measuredCost).toBe(8000);

		const occupant3Bill = result.value.billsToInsert.find((b) => b.occupantId === occupant3.id);
		expect(occupant3Bill?.totalCost).toBe(8000);
		expect(occupant3Bill?.costPerSquareMeter).toBe(800);
		expect(occupant3Bill?.fixedCost).toBeUndefined();
		expect(occupant3Bill?.measuredCost).toBeUndefined();
	});

	test.concurrent('handles real world calculation scenario', ({ expect }) => {
		// Setup
		const owner1ElectricityConsumption = makeMeasurement('owner1', 'electricity', 150);
		const owner1WaterConsumption = makeMeasurement('owner1', 'water', 3);
		const owner1HeatingConsumption = makeMeasurement('owner1', 'heating', 5);
		const owner1 = makeOwner('owner1', buildingId, {
			heatingFixedCostShare: null,
			measuringDevices: [
				owner1ElectricityConsumption,
				owner1WaterConsumption,
				owner1HeatingConsumption
			]
		});
		const owner2ElectricityConsumption = makeMeasurement('owner2', 'electricity', 200);
		const owner2WaterConsumption = makeMeasurement('owner2', 'water', 6.5);
		const owner2HeatingConsumption = makeMeasurement('owner2', 'heating', 10);
		const owner2 = makeOwner('owner2', buildingId, {
			heatingFixedCostShare: 10,
			measuringDevices: [
				owner2ElectricityConsumption,
				owner2WaterConsumption,
				owner2HeatingConsumption
			]
		});
		const oliera = makeOwner('oliera', buildingId, {
			heatingFixedCostShare: 771,
			measuringDevices: []
		});
		const renter1 = makeRenter('renter1', buildingId, { squareMeters: 20 });
		const renter2 = makeRenter('renter2', buildingId, { squareMeters: 10 });
		const renter3 = makeRenter('renter3', buildingId, { squareMeters: 50 });

		// Electricity
		const electricityResult = calculateBills({
			billingPeriodId,
			buildingId,
			energyType: 'electricity',
			totalConsumption: 1550,
			totalCost: 9300,
			dateRange: {
				start: new Date('2024-01-01T00:00:00Z'),
				end: new Date('2024-01-31T00:00:00Z')
			},
			occupants: [renter1, renter2, renter3, owner1, owner2]
		});
		assert(electricityResult.success === true);
		expect(electricityResult.value).toMatchSnapshot();

		// Water
		const waterResult = calculateBills({
			billingPeriodId,
			buildingId,
			energyType: 'water',
			totalConsumption: 11.6,
			totalCost: 1023.352,
			dateRange: {
				start: new Date('2024-01-01T00:00:00Z'),
				end: new Date('2024-01-31T00:00:00Z')
			},
			occupants: [renter1, renter2, renter3, owner1, owner2]
		});
		assert(waterResult.success === true);
		expect(waterResult.value).toMatchSnapshot();

		// Heating - this is where things get interesting since there's a fixed cost share
		const heatingResult = calculateBills({
			billingPeriodId,
			buildingId,
			energyType: 'heating',
			totalConsumption: 95,
			totalCost: 42388.05,
			fixedCost: 5000,
			dateRange: {
				start: new Date('2024-01-01T00:00:00Z'),
				end: new Date('2024-01-31T00:00:00Z')
			},
			occupants: [renter1, renter2, renter3, owner1, owner2, oliera]
		});
		assert(heatingResult.success === true);
		expect(heatingResult.value).toMatchSnapshot();
	});
});

// -- Helpers --

function makeMeasurement(
	label: string,
	energyType: EnergyType,
	consumption: number
): MeasuringDeviceConsumption {
	return {
		id: ('measurement_record_' + label) as ID,
		energyType,
		consumption
	};
}

function makeRenter(
	label: string,
	buildingId: ID,
	values: Partial<OccupantCalculationEntry> = {}
): OccupantCalculationEntry {
	return {
		...makeOccupant(buildingId),
		measuringDevices: [],
		chargedUnmeasuredElectricity: true,
		chargedUnmeasuredHeating: true,
		chargedUnmeasuredWater: true,
		...values,
		id: ('occupant_' + label) as ID
	};
}

function makeOwner(
	label: string,
	buildingId: ID,
	values: Partial<OccupantCalculationEntry> = {}
): OccupantCalculationEntry {
	return {
		...makeOccupant(buildingId),
		measuringDevices: [],
		chargedUnmeasuredElectricity: false,
		chargedUnmeasuredHeating: false,
		chargedUnmeasuredWater: false,
		...values,
		id: ('occupant_' + label) as ID
	};
}

function makeOccupant(buildingId: ID): Occupant {
	return {
		id: `occupant_${buildingId}` as ID,
		buildingId,
		chargedUnmeasuredElectricity: false,
		chargedUnmeasuredHeating: false,
		chargedUnmeasuredWater: false,
		name: 'Occupant',
		squareMeters: 69,
		created: new Date('2023-01-01T00:00:00Z'),
		deleted: null,
		archived: null,
		heatingFixedCostShare: null,
		isDeleted: false,
		isArchived: false,
		updated: new Date('2024-01-01T00:00:00Z')
	};
}
