import { id, type ID } from '$lib/models/common';
import type { Occupant } from '$lib/models/occupant';
import { assert, describe, expect, it } from 'vitest';
import {
	CalculationInputError,
	calculateElectricityBills,
	type MeasuringDeviceBillRecord,
	type OccupantWithMeasuringDeviceRecords
} from './calculate-electricity';

describe('calculateElectricityBills', () => {
	// Context
	const buildingId = id();
	const billingPeriodId = id();
	const renterA = createRenter(buildingId, { name: 'Renter A', squareMeters: 10 });
	const renterB = createRenter(buildingId, { name: 'Renter B', squareMeters: 20 });
	const rentersMeasurement = createMeasurementRecord(100);
	const renterWithDevice = createRenter(buildingId, {
		name: 'Renter w/ device',
		squareMeters: 30,
		measuringDevices: [rentersMeasurement]
	});
	const ownerAMeasurement = createMeasurementRecord(50.55);
	const ownerA = createOwner(buildingId, {
		name: 'Owner A',
		squareMeters: 20,
		measuringDevices: [ownerAMeasurement]
	});
	const ownerBMeasurement = createMeasurementRecord(75.12);
	const ownerB = createOwner(buildingId, {
		name: 'Owner B',
		squareMeters: 70,
		measuringDevices: [ownerBMeasurement]
	});

	// Tests
	it('calculates bills for renters only', () => {
		const result = calculateElectricityBills({
			buildingId,
			billingPeriodId,
			consumption: 1200,
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
	it('calculates bills for renters with measuring devices', () => {
		const result = calculateElectricityBills({
			buildingId,
			billingPeriodId,
			consumption: 1200,
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
				measuringDeviceId: rentersMeasurement.id
			}
		]);
	});
	it('calculates bills for renters, renters with measuring devices and owners', () => {
		const result = calculateElectricityBills({
			billingPeriodId,
			buildingId,
			consumption: 1500,
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
				measuringDeviceId: rentersMeasurement.id
			},
			{
				energyType: 'electricity',
				consumption: 50.55,
				measuringDeviceId: ownerAMeasurement.id
			},
			{
				energyType: 'electricity',
				consumption: 75.12,
				measuringDeviceId: ownerBMeasurement.id
			}
		]);
	});
	it('fails given no occupants', () => {
		const result = calculateElectricityBills({
			billingPeriodId,
			buildingId,
			consumption: 1500,
			totalCost: 9000,
			dateRange: {
				start: new Date('2024-01-01T00:00:00Z'),
				end: new Date('2024-01-31T00:00:00Z')
			},
			occupants: []
		});
		assert(result.success === false, 'Calculation did not fail, but should');
		expect(result.error).toBeInstanceOf(CalculationInputError);
	});
});

// Helpers

function createMeasurementRecord(consumption: number): MeasuringDeviceBillRecord {
	return {
		id: id(),
		energyType: 'electricity',
		name: 'Main',
		consumption
	};
}

function createRenter(
	buildingId: ID,
	values: Partial<OccupantWithMeasuringDeviceRecords> = {}
): OccupantWithMeasuringDeviceRecords {
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
	values: Partial<OccupantWithMeasuringDeviceRecords> = {}
): OccupantWithMeasuringDeviceRecords {
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
