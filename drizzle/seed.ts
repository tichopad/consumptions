import { faker } from '@faker-js/faker/locale/cs_CZ';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { z } from 'zod';
import { energyTypes, type ID } from '../src/lib/helpers';
import {
	buildings,
	consumptionRecords,
	energyBills,
	measuringDevices,
	occupants,
	type BuildingInsert,
	type ConsumptionRecordInsert,
	type EnergyBillInsert,
	type MeasuringDeviceInsert,
	type OccupantInsert
} from '../src/lib/server/db/schema';

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
	if (Math.random() > 0.5) return [];
	const count = faker.number.int({ min: 1, max: 2 });
	return new Array(count).fill(null).map(() => createMeasuringDevice(occupant.id));
});
const newMeasuringDevices = await db
	.insert(measuringDevices)
	.values(measuringDevicesValues)
	.returning();
console.log('Inserted measuring devices:', newMeasuringDevices.map((d) => d.name).join(', '));

const consumptionRecordsValues = newMeasuringDevices.flatMap((device) => {
	if (Math.random() > 0.5) return [];
	const count = faker.number.int({ min: 1, max: 10 });
	return new Array(count).fill(null).map(() => createConsumptionRecord(device.id));
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

// Helpers

function createBuilding(): BuildingInsert {
	return {
		name: faker.location.streetAddress(),
		squareMeters: faker.number.int({ min: 100, max: 1000 })
	};
}
function createOccupant(buildingId: ID): OccupantInsert {
	return {
		buildingId,
		name: Math.random() > 0.6 ? faker.person.fullName() : faker.company.name(),
		squareMeters: faker.number.int({ min: 10, max: 100 }),
		chargedUnmeasuredElectricity: faker.datatype.boolean(),
		chargedUnmeasuredHeating: faker.datatype.boolean(),
		chargedUnmeasuredWater: faker.datatype.boolean(),
		heatingFixedCostShare: Math.random() > 0.5 ? faker.number.float({ min: 0, max: 100 }) : null
	};
}
function createMeasuringDevice(occupantId: ID): MeasuringDeviceInsert {
	return {
		occupantId,
		name: Math.random() > 0.7 ? faker.commerce.product() : 'Main meter',
		energyType: faker.helpers.arrayElement(energyTypes)
	};
}
function createConsumptionRecord(measuringDeviceId: ID): ConsumptionRecordInsert {
	const startDate = faker.date.recent();
	return {
		measuringDeviceId,
		startDate,
		endDate: new Date(startDate.getFullYear(), startDate.getMonth() + 1, startDate.getDate()),
		consumption: faker.number.float({ min: 0, max: 1000 }),
		unmeasured: faker.datatype.boolean()
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
