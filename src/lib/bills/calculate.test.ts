import { id, type EnergyType, type ID } from '$lib/models/common';
import type { Occupant } from '$lib/models/occupant';
import { isNullable, sumPreciseBy } from '$lib/utils';
import { assert, describe, expect, test } from 'vitest';
import { CalculationInputError, calculateBills } from './calculate';
import type { MeasuringDeviceConsumption, OccupantCalculationEntry } from './calculation-types';

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
	const ownerAHeatingConsumption = createMeasurementRecord('heating', 10);
	const ownerA = createOwner(buildingId, {
		squareMeters: 20,
		measuringDevices: [
			ownerAElectricityConsumption,
			ownerAHeatingConsumption,
			ownerAWaterConsumption
		]
	});

	const ownerBWaterConsumption = createMeasurementRecord('water', 3);
	const ownerBElectricityConsumption = createMeasurementRecord('electricity', 75.12);
	const ownerBHeatingConsumption = createMeasurementRecord('heating', 5);
	const ownerB = createOwner(buildingId, {
		heatingFixedCostShare: 10,
		measuringDevices: [
			ownerBElectricityConsumption,
			ownerBHeatingConsumption,
			ownerBWaterConsumption
		]
	});

	const ownerCWaterConsumption = createMeasurementRecord('water', 3);
	const ownerCElectricityConsumption = createMeasurementRecord('electricity', 75.12);
	const ownerCHeatingConsumption = createMeasurementRecord('heating', 6.5);
	const ownerC = createOwner(buildingId, {
		heatingFixedCostShare: 90,
		measuringDevices: [
			ownerCElectricityConsumption,
			ownerCHeatingConsumption,
			ownerCWaterConsumption
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

	test('calculates heating bill correctly', () => {
		const result = calculateBills({
			billingPeriodId,
			buildingId,
			energyType: 'heating',
			fixedCost: 5000,
			totalConsumption: 95,
			totalCost: 42500,
			dateRange: {
				start: new Date('2024-01-01T00:00:00Z'),
				end: new Date('2024-01-31T00:00:00Z')
			},
			occupants: [renterA, renterB, ownerA, ownerB, ownerC]
		});

		assert(result.success);

		const ownerABill = result.value.billsToInsert.find((b) => b.occupantId === ownerA.id);
		assert(ownerABill !== undefined, 'Owner A bill not found');
		expect(ownerABill.fixedCost).toBeUndefined();
		expect(ownerABill.measuredCost).toBe(ownerABill.totalCost);
		expect(ownerABill.totalCost.toFixed(2)).toBe('4473.68');

		const ownerBBill = result.value.billsToInsert.find((b) => b.occupantId === ownerB.id);
		assert(ownerBBill !== undefined, 'Owner B bill not found');
		assert(!isNullable(ownerBBill.fixedCost), 'Owner B fixed cost not defined');
		assert(!isNullable(ownerBBill.measuredCost), 'Owner B measured cost not defined');
		expect(ownerBBill.fixedCost).toBe(500);
		expect(ownerBBill.measuredCost.toFixed(2)).toBe('2236.84');
		expect(ownerBBill.totalCost.toFixed(2)).toBe('2736.84');

		const ownerCBill = result.value.billsToInsert.find((b) => b.occupantId === ownerC.id);
		assert(ownerCBill !== undefined, 'Owner C bill not found');
		assert(!isNullable(ownerCBill.fixedCost), 'Owner C fixed cost not defined');
		assert(!isNullable(ownerCBill.measuredCost), 'Owner C measured cost not defined');
		expect(ownerCBill.fixedCost).toBe(4500);
		expect(ownerCBill.measuredCost.toFixed(2)).toBe('2907.89');
		expect(ownerCBill.totalCost.toFixed(2)).toBe('7407.89');

		const occupantsBills = result.value.billsToInsert.filter((b) => isNullable(b.buildingId));

		const occupantsFixedCostSum = sumPreciseBy(occupantsBills, (b) => b.fixedCost ?? 0);
		expect(occupantsFixedCostSum.toFixed(2)).toBe('5000.00');

		const occupantsTotalCostSum = sumPreciseBy(occupantsBills, (b) => b.totalCost);
		expect(occupantsTotalCostSum.toFixed(2)).toBe('42500.00');

		const buildingBill = result.value.billsToInsert.find((b) => !isNullable(b.buildingId));
		assert(!isNullable(buildingBill), 'Building bill is not defined');
		expect(buildingBill.fixedCost).toBe(5000);
		expect(buildingBill.totalCost).toBe(42500);
		expect(buildingBill.costPerSquareMeter?.toFixed(2)).toBe('929.39');
		expect(buildingBill.costPerUnit?.toFixed(2)).toBe('447.37');
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

	test('can handle weird negative calculation scenario', () => {
		const owner1ElectricityConsumption = createMeasurementRecord('electricity', 150);
		const owner1WaterConsumption = createMeasurementRecord('water', 3);
		const owner1HeatingConsumption = createMeasurementRecord('heating', 5);
		const owner1 = createOwner(buildingId, {
			heatingFixedCostShare: null,
			measuringDevices: [
				owner1ElectricityConsumption,
				owner1WaterConsumption,
				owner1HeatingConsumption
			]
		});
		const owner2ElectricityConsumption = createMeasurementRecord('electricity', 200);
		const owner2WaterConsumption = createMeasurementRecord('water', 6.5);
		const owner2HeatingConsumption = createMeasurementRecord('heating', 10);
		const owner2 = createOwner(buildingId, {
			heatingFixedCostShare: 10,
			measuringDevices: [
				owner2ElectricityConsumption,
				owner2WaterConsumption,
				owner2HeatingConsumption
			]
		});
		const oliera = createOwner(buildingId, {
			heatingFixedCostShare: 771,
			measuringDevices: []
		});
		const renter1 = createRenter(buildingId, { squareMeters: 20 });
		const renter2 = createRenter(buildingId, { squareMeters: 10 });
		const renter3 = createRenter(buildingId, { squareMeters: 50 });

		console.log({
			owner1Id: owner1.id,
			owner2Id: owner2.id,
			renter1Id: renter1.id,
			renter2Id: renter2.id,
			renter3Id: renter3.id
		});

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
		expect(electricityResult.value.billsToInsert).toMatchObject([
			{
				occupantId: owner1.id,
				costPerUnit: 6,
				totalCost: 900
			},
			{
				occupantId: owner2.id,
				costPerUnit: 6,
				totalCost: 1200
			},
			{
				occupantId: renter1.id,
				costPerSquareMeter: 90,
				totalCost: 1800
			},
			{
				occupantId: renter2.id,
				costPerSquareMeter: 90,
				totalCost: 900
			},
			{
				occupantId: renter3.id,
				costPerSquareMeter: 90,
				totalCost: 4500
			},
			{
				buildingId,
				costPerSquareMeter: 90,
				costPerUnit: 6,
				totalCost: 9300
			}
		]);

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
		expect(waterResult.value.billsToInsert).toMatchObject([
			{
				occupantId: owner1.id,
				costPerUnit: 88.22,
				totalCost: 264.66
			},
			{
				occupantId: owner2.id,
				costPerUnit: 88.22,
				totalCost: 573.43
			},
			{
				occupantId: renter1.id,
				costPerSquareMeter: 2.315775,
				totalCost: 46.3155
			},
			{
				occupantId: renter2.id,
				costPerSquareMeter: 2.315775,
				totalCost: 23.15775
			},
			{
				occupantId: renter3.id,
				costPerSquareMeter: 2.315775,
				totalCost: 115.78875
			},
			{
				buildingId,
				costPerSquareMeter: 2.315775,
				costPerUnit: 88.22,
				totalCost: 1023.352
			}
		]);

		// Heating - weird stuff happens here
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
		expect(heatingResult.value.billsToInsert).toMatchObject([
			{
				occupantId: owner1.id,
				costPerUnit: 446.19,
				totalCost: 2230.95
			},
			{
				occupantId: owner2.id,
				costPerUnit: 446.19,
				totalCost: 4525.920486555698
			},
			{
				occupantId: renter1.id,
				costPerSquareMeter: 383.69,
				totalCost: 7673.8
			},
			{
				occupantId: renter2.id,
				costPerSquareMeter: 383.69,
				totalCost: 3836.9
			},
			{
				occupantId: renter3.id,
				costPerSquareMeter: 383.69,
				totalCost: 19184.5
			},
			{
				buildingId,
				costPerSquareMeter: 383.69,
				costPerUnit: 446.19,
				totalCost: 42388.05
			}
		]);
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
