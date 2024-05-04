import { id, type EnergyType, type ID } from '$lib/models/common';
import type { Occupant } from '$lib/models/occupant';
import { assert, describe, expect, test } from 'vitest';
import { CalculationInputError, calculateBills } from './calculate';
import type { MeasuringDeviceConsumption, OccupantCalculationEntry } from './calculation-types';
import { sumPreciseBy } from '$lib/utils';

describe('calculateBills', () => {
	// -- Context --

	const buildingId = id();
	const billingPeriodId = id();

	const renterA = createRenter(buildingId, { squareMeters: 10 });
	const renterB = createRenter(buildingId, { squareMeters: 20 });

	const rentersElectricityConsumption = createMeasurementRecord('electricity', 100);
	const renterWithDevice = createRenter(buildingId, {
		squareMeters: 30,
		measuringDevices: [rentersElectricityConsumption]
	});

	const ownerAWaterConsumption = createMeasurementRecord('water', 2);
	const ownerAElectricityConsumption = createMeasurementRecord('electricity', 50.55);
	const ownerA = createOwner(buildingId, {
		squareMeters: 20,
		measuringDevices: [ownerAElectricityConsumption, ownerAWaterConsumption]
	});

	const ownerBWaterConsumption = createMeasurementRecord('water', 3);
	const ownerBElectricityConsumption = createMeasurementRecord('electricity', 75.12);
	const ownerB = createOwner(buildingId, {
		squareMeters: 70,
		measuringDevices: [ownerBElectricityConsumption, ownerBWaterConsumption]
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

		expect(billsToInsert).toMatchObject([
			{
				billedArea: 10,
				costPerSquareMeter: 240,
				energyType: 'electricity',
				occupantId: renterA.id,
				totalCost: 2400
			},
			{
				billedArea: 20,
				costPerSquareMeter: 240,
				energyType: 'electricity',
				occupantId: renterB.id,
				totalCost: 4800
			},
			{
				buildingId,
				costPerSquareMeter: 240,
				costPerUnit: 6,
				energyType: 'electricity',
				totalConsumption: 1200,
				totalCost: 7200
			}
		]);
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
		const { billsToInsert, consumptionRecordsToInsert } = result.value;

		expect(billsToInsert).toMatchObject([
			{
				energyType: 'electricity',
				totalCost: 600,
				costPerUnit: 6,
				totalConsumption: 100,
				occupantId: renterWithDevice.id,
				measuredCost: 600
			},
			{
				billedArea: 10,
				costPerSquareMeter: 110,
				energyType: 'electricity',
				occupantId: renterA.id,
				totalCost: 1100
			},
			{
				billedArea: 20,
				costPerSquareMeter: 110,
				energyType: 'electricity',
				occupantId: renterB.id,
				totalCost: 2200
			},
			{
				billedArea: 30,
				costPerSquareMeter: 110,
				energyType: 'electricity',
				occupantId: renterWithDevice.id,
				totalCost: 3300
			},
			{
				buildingId,
				costPerSquareMeter: 110,
				costPerUnit: 6,
				energyType: 'electricity',
				totalConsumption: 1200,
				totalCost: 7200
			}
		]);
		expect(consumptionRecordsToInsert).toMatchObject([
			{
				energyType: 'electricity',
				consumption: 100,
				measuringDeviceId: rentersElectricityConsumption.id
			}
		]);
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
		const { billsToInsert, consumptionRecordsToInsert } = result.value;

		expect(billsToInsert).toMatchObject([
			{
				energyType: 'electricity',
				totalCost: 600,
				costPerUnit: 6,
				totalConsumption: 100,
				occupantId: renterWithDevice.id,
				measuredCost: 600
			},
			{
				energyType: 'electricity',
				totalCost: 303.3,
				costPerUnit: 6,
				totalConsumption: 50.55,
				occupantId: ownerA.id,
				measuredCost: 303.3
			},
			{
				energyType: 'electricity',
				totalCost: 450.72,
				costPerUnit: 6,
				totalConsumption: 75.12,
				occupantId: ownerB.id,
				measuredCost: 450.72
			},
			{
				billedArea: 10,
				costPerSquareMeter: 127.433,
				energyType: 'electricity',
				occupantId: renterA.id,
				totalCost: 1274.33
			},
			{
				billedArea: 20,
				costPerSquareMeter: 127.433,
				energyType: 'electricity',
				occupantId: renterB.id,
				totalCost: 2548.66
			},
			{
				billedArea: 30,
				costPerSquareMeter: 127.433,
				energyType: 'electricity',
				occupantId: renterWithDevice.id,
				totalCost: 3822.99
			},
			{
				buildingId,
				costPerSquareMeter: 127.433,
				costPerUnit: 6,
				energyType: 'electricity',
				totalConsumption: 1500,
				totalCost: 9000
			}
		]);
		expect(consumptionRecordsToInsert).toMatchObject([
			{
				energyType: 'electricity',
				consumption: 100,
				measuringDeviceId: rentersElectricityConsumption.id
			},
			{
				energyType: 'electricity',
				consumption: 50.55,
				measuringDeviceId: ownerAElectricityConsumption.id
			},
			{
				energyType: 'electricity',
				consumption: 75.12,
				measuringDeviceId: ownerBElectricityConsumption.id
			}
		]);
	});

	test('calculates mixed energy type bills correctly', () => {
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

		expect(electricityResult.value.billsToInsert).toMatchObject([
			{
				energyType: 'electricity',
				totalCost: 600,
				costPerUnit: 6,
				totalConsumption: 100,
				occupantId: renterWithDevice.id,
				measuredCost: 600
			},
			{
				energyType: 'electricity',
				totalCost: 303.3,
				costPerUnit: 6,
				totalConsumption: 50.55,
				occupantId: ownerA.id,
				measuredCost: 303.3
			},
			{
				energyType: 'electricity',
				totalCost: 450.72,
				costPerUnit: 6,
				totalConsumption: 75.12,
				occupantId: ownerB.id,
				measuredCost: 450.72
			},
			{
				billedArea: 10,
				costPerSquareMeter: 191.1495,
				energyType: 'electricity',
				occupantId: renterA.id,
				totalCost: 1911.495
			},
			{
				billedArea: 30,
				costPerSquareMeter: 191.1495,
				energyType: 'electricity',
				occupantId: renterWithDevice.id,
				totalCost: 5734.485
			},
			{
				buildingId,
				costPerSquareMeter: 191.1495,
				costPerUnit: 6,
				energyType: 'electricity',
				totalConsumption: 1500,
				totalCost: 9000
			}
		]);
		expect(electricityResult.value.consumptionRecordsToInsert).toMatchObject([
			{
				consumption: 100,
				energyType: 'electricity',
				measuringDeviceId: rentersElectricityConsumption.id
			},
			{
				consumption: 50.55,
				energyType: 'electricity',
				measuringDeviceId: ownerAElectricityConsumption.id
			},
			{
				consumption: 75.12,
				energyType: 'electricity',
				measuringDeviceId: ownerBElectricityConsumption.id
			}
		]);

		assert(waterResult.success);

		expect(waterResult.value.billsToInsert).toMatchObject([
			{
				energyType: 'water',
				totalCost: 200,
				costPerUnit: 100,
				totalConsumption: 2,
				occupantId: ownerA.id,
				measuredCost: 200
			},
			{
				energyType: 'water',
				totalCost: 300,
				costPerUnit: 100,
				totalConsumption: 3,
				occupantId: ownerB.id,
				measuredCost: 300
			},
			{
				billedArea: 10,
				costPerSquareMeter: 12.5,
				energyType: 'water',
				occupantId: renterA.id,
				totalCost: 125
			},
			{
				billedArea: 30,
				costPerSquareMeter: 12.5,
				energyType: 'water',
				occupantId: renterWithDevice.id,
				totalCost: 375
			},
			{
				buildingId,
				costPerSquareMeter: 12.5,
				costPerUnit: 100,
				energyType: 'water',
				totalConsumption: 10,
				totalCost: 1000
			}
		]);

		expect(waterResult.value.consumptionRecordsToInsert).toMatchObject([
			{
				consumption: 2,
				energyType: 'water',
				measuringDeviceId: ownerAWaterConsumption.id
			},
			{
				consumption: 3,
				energyType: 'water',
				measuringDeviceId: ownerBWaterConsumption.id
			}
		]);
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
		expect(occupantsElectricityBillsSum.toNumber()).toBe(9000);

		const occupantsWaterBills = waterResult.value.billsToInsert.filter((b) => !b.buildingId);
		const occupantsWaterBillsSum = sumPreciseBy(occupantsWaterBills, (b) => b.totalCost);
		expect(occupantsWaterBillsSum.toNumber()).toBe(1000);
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
			totalConsumption: 0,
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
});

// -- Helpers --

function createMeasurementRecord(
	energyType: EnergyType,
	consumption: number
): MeasuringDeviceConsumption {
	return {
		id: id(),
		energyType,
		consumption
	};
}

function createRenter(
	buildingId: ID,
	values: Partial<OccupantCalculationEntry> = {}
): OccupantCalculationEntry {
	return {
		...createOccupant(buildingId),
		measuringDevices: [],
		chargedUnmeasuredElectricity: true,
		chargedUnmeasuredHeating: true,
		chargedUnmeasuredWater: true,
		...values
	};
}

function createOwner(
	buildingId: ID,
	values: Partial<OccupantCalculationEntry> = {}
): OccupantCalculationEntry {
	return {
		...createOccupant(buildingId),
		measuringDevices: [],
		chargedUnmeasuredElectricity: false,
		chargedUnmeasuredHeating: false,
		chargedUnmeasuredWater: false,
		...values
	};
}

function createOccupant(buildingId: ID): Occupant {
	return {
		id: id(),
		buildingId,
		chargedUnmeasuredElectricity: false,
		chargedUnmeasuredHeating: false,
		chargedUnmeasuredWater: false,
		name: 'Occupant',
		squareMeters: 69,
		created: new Date(),
		deleted: null,
		heatingFixedCostShare: null,
		isDeleted: false,
		updated: new Date()
	};
}
