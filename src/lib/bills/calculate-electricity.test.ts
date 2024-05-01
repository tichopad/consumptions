import { id, type ID } from '$lib/models/common';
import type { Occupant } from '$lib/models/occupant';
import { faker } from '@faker-js/faker/locale/cs_CZ';
import { describe, expect, it } from 'vitest';
import {
	calculateElectricityBills,
	type MeasuringDeviceBillRecord,
	type OccupantWithMeasuringDevices
} from './calculate-electricity';

describe('calculateElectricityBills', () => {
	// Context
	const buildingId = id();
	const billingPeriodId = id();
	const renterA = createRenter(buildingId, { name: 'Renter A', squareMeters: 10 });
	const renterB = createRenter(buildingId, { name: 'Renter B', squareMeters: 20 });
	const renterWithDevice = createRenter(buildingId, { name: 'Renter w/ device', squareMeters: 30 });
	const rentersMeasuringDevice = createMeasurementRecord(100);
	renterWithDevice.measuringDevices = [rentersMeasuringDevice];

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
		expect(result.billsToInsert).toMatchObject([
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
		for (const bill of result.billsToInsert) {
			if (bill.occupantId) expect(bill.buildingId).toBeFalsy();
			else if (bill.buildingId) expect(bill.occupantId).toBeFalsy();
		}
		// There shouldn't be any consumption records
		expect(result.consumptionRecordsToInsert).toHaveLength(0);
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
		expect(result.billsToInsert).toMatchObject([
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
		expect(result.consumptionRecordsToInsert).toMatchObject([
			{
				energyType: 'electricity',
				consumption: 100,
				measuringDeviceId: rentersMeasuringDevice.id
			}
		]);
	});
});

// -- Helpers --

function createOccupant(buildingId: ID): Occupant {
	const now = new Date();
	return {
		id: id(),
		buildingId,
		chargedUnmeasuredElectricity: false,
		chargedUnmeasuredHeating: false,
		chargedUnmeasuredWater: false,
		name: faker.datatype.boolean() ? faker.company.name() : faker.person.fullName(),
		squareMeters: 69,
		created: now,
		deleted: null,
		heatingFixedCostShare: null,
		isDeleted: false,
		updated: now
	};
}

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
	values: Partial<Occupant> = {}
): OccupantWithMeasuringDevices {
	const occupant = createOccupant(buildingId);
	occupant.chargedUnmeasuredElectricity = true;
	occupant.chargedUnmeasuredHeating = true;
	occupant.chargedUnmeasuredWater = true;
	occupant.heatingFixedCostShare = null;
	return { ...occupant, measuringDevices: [], ...values };
}
