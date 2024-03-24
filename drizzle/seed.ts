import { faker } from '@faker-js/faker/locale/cs_CZ';
import { createClient } from '@libsql/client';
import '@total-typescript/ts-reset';
import { drizzle } from 'drizzle-orm/libsql';
import { z } from 'zod';
import {
	buildings,
	consumptionRecords,
	energyBills,
	EnergyType,
	energyTypes,
	measuringDevices,
	occupants,
	type BuildingInsert,
	type ConsumptionRecordInsert,
	type EnergyBillInsert,
	type ID,
	type MeasuringDeviceInsert,
	type OccupantInsert
} from '../src/lib/models/schema';

// Get environment variables
const env = z.object({ DATABASE_URL: z.string() }).parse(process.env);
const db = drizzle(createClient({ url: env.DATABASE_URL }));

// Seed the database

const [building] = await db.insert(buildings).values(createBuilding()).returning();
console.log('Inserted building:', building.name);

const occupantsValues = new Array(10).fill(null).map(() => createOccupant(building.id));
const newOccupants = await db.insert(occupants).values(occupantsValues).returning();
console.log('Inserted occupants:', newOccupants.map((o) => o.name).join(', '));

const measuringDevicesValues = newOccupants.flatMap((occupant) => {
	return energyTypes
		.map((energyType) => {
			switch (energyType) {
				case 'electricity': {
					if (occupant.chargedUnmeasuredElectricity) {
						return Math.random() > 0.3 ? null : createMeasuringDevice(occupant.id, energyType);
					} else {
						return createMeasuringDevice(occupant.id, energyType);
					}
				}
				case 'heating': {
					if (occupant.chargedUnmeasuredHeating) {
						return null;
					} else {
						return createMeasuringDevice(occupant.id, energyType);
					}
				}
				case 'water': {
					if (occupant.chargedUnmeasuredWater) {
						return Math.random() > 0.2 ? null : createMeasuringDevice(occupant.id, energyType);
					} else {
						return createMeasuringDevice(occupant.id, energyType);
					}
				}
			}
		})
		.filter(Boolean);
});
const newMeasuringDevices = await db
	.insert(measuringDevices)
	.values(measuringDevicesValues)
	.returning();
console.log('Inserted measuring devices:', newMeasuringDevices.map((d) => d.name).join(', '));

/*
const consumptionRecordsValues = newMeasuringDevices.flatMap((device) => {
	if (Math.random() > 0.5) return [];
	const count = faker.number.int({ min: 1, max: 10 });
	return new Array(count)
		.fill(null)
		.map(() => createConsumptionRecord(device.id, device.energyType));
});
const newConsumptionRecords = await db
	.insert(consumptionRecords)
	.values(consumptionRecordsValues)
	.returning();
console.log('Inserted consumption records:', newConsumptionRecords.length);

const energyBillsValues = new Array(faker.number.int({ min: 5, max: 10 }))
	.fill(null)
	.map(() => createEnergyBill(building.id));
const newEnergyBills = await db.insert(energyBills).values(energyBillsValues).returning();
console.log('Inserted energy bills:', newEnergyBills.length);
*/

// Helpers

function createBuilding(): BuildingInsert {
	return {
		name: faker.location.streetAddress(),
		squareMeters: faker.number.int({ min: 100, max: 1000 })
	};
}
function createOccupant(buildingId: ID): OccupantInsert {
	const isRenting = faker.datatype.boolean(0.75);
	const chargedUnmeasuredHeating = isRenting;

	return {
		buildingId,
		name: Math.random() > 0.6 ? faker.person.fullName() : faker.company.name(),
		squareMeters: faker.number.int({ min: 10, max: 100 }),
		chargedUnmeasuredElectricity: isRenting,
		chargedUnmeasuredHeating,
		chargedUnmeasuredWater: isRenting,
		heatingFixedCostShare: chargedUnmeasuredHeating
			? faker.number.float({ min: 0, max: 400 })
			: null
	};
}
function createMeasuringDevice(occupantId: ID, energyType: EnergyType): MeasuringDeviceInsert {
	const names: Record<EnergyType, string[]> = {
		electricity: ['Hlavní měřič', 'Přímotopný měřič', 'Měřič na kuchyňský sporák'],
		heating: ['Hlavní měřič'],
		water: ['Hlavní měřič', 'Měřič na kuchyňský dřez', 'Měřič na koupelnu']
	};
	return {
		occupantId,
		name: faker.helpers.arrayElement(names[energyType]),
		energyType
	};
}
function createConsumptionRecord(
	measuringDeviceId: ID,
	energyType: EnergyType
): ConsumptionRecordInsert {
	const startDate = faker.date.recent();
	return {
		measuringDeviceId,
		startDate,
		endDate: new Date(startDate.getFullYear(), startDate.getMonth() + 1, startDate.getDate()),
		consumption: faker.number.float({ min: 1, max: 1000 }),
		energyType
	};
}
function createEnergyBill(buildingId: ID): EnergyBillInsert {
	const startDate = faker.date.recent();
	const energyType = faker.helpers.arrayElement(energyTypes);
	return {
		buildingId,
		startDate,
		endDate: new Date(startDate.getFullYear(), startDate.getMonth() + 1, startDate.getDate()),
		energyType,
		totalCost: faker.number.int({ min: 100_000, max: 10_000_000 }),
		fixedCost: energyType === 'heating' ? faker.number.int({ min: 20_000, max: 200_000 }) : null
	};
}
