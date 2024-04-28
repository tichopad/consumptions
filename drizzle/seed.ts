import { faker } from '@faker-js/faker/locale/cs_CZ';
import { createClient } from '@libsql/client';
import '@total-typescript/ts-reset';
import { drizzle } from 'drizzle-orm/libsql';
import { z } from 'zod';
import {
	buildings,
	EnergyType,
	energyTypes,
	measuringDevices,
	occupants,
	type BuildingInsert,
	type ID,
	type MeasuringDeviceInsert,
	type OccupantInsert
} from '../src/lib/models/schema';
import { installIntoGlobal } from 'iterator-helpers-polyfill';

// Injects https://github.com/tc39/proposal-iterator-helpers into the global namespace
installIntoGlobal();

// Get environment variables
const env = z.object({ DATABASE_URL: z.string() }).parse(process.env);
const db = drizzle(createClient({ url: env.DATABASE_URL }));

// Seed the database

const [building1] = await db.insert(buildings).values(building()).returning();
console.log('Inserted building:', building.name);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const [renter1, renter2, renter3, owner1, owner2] = await db
	.insert(occupants)
	.values([
		occupant(building1.id, true, { name: 'Renter 1', squareMeters: 20 }),
		occupant(building1.id, true, { name: 'Renter 2', squareMeters: 10 }),
		occupant(building1.id, true, { name: 'Renter 3', squareMeters: 50 }),
		occupant(building1.id, false, { name: 'Owner 1', heatingFixedCostShare: null }),
		occupant(building1.id, false, { name: 'Owner 2', heatingFixedCostShare: 10 }),
		occupant(building1.id, false, { name: 'Oliera', heatingFixedCostShare: 771 })
	])
	.returning();

await db
	.insert(measuringDevices)
	.values(
		[
			energyTypes.map((type) => device(owner1.id, type, 'Hlavní měřič')),
			energyTypes.map((type) => device(owner2.id, type, 'Hlavní měřič'))
		].flat()
	)
	.returning();

console.log('Seeding done ✅');

// -- Helpers --

function building(): BuildingInsert {
	return {
		name: faker.location.streetAddress(),
		squareMeters: faker.number.int({ min: 100, max: 1000 })
	};
}

function occupant(
	buildingId: ID,
	rents?: boolean,
	values: Partial<OccupantInsert> = {}
): OccupantInsert {
	const isRenter = rents ?? faker.datatype.boolean(0.75);
	return {
		buildingId,
		chargedUnmeasuredElectricity: isRenter,
		chargedUnmeasuredHeating: isRenter,
		chargedUnmeasuredWater: isRenter,
		heatingFixedCostShare: isRenter ? null : faker.number.float({ max: 781 }),
		name: faker.person.fullName(),
		squareMeters: faker.number.int({ max: 100 }),
		...values
	};
}

function device(occupantId: ID, energyType: EnergyType, name?: string): MeasuringDeviceInsert {
	const names: Record<EnergyType, string[]> = {
		electricity: ['Hlavní měřič', 'Přímotopný měřič', 'Měřič na kuchyňský sporák'],
		heating: ['Hlavní měřič'],
		water: ['Hlavní měřič', 'Měřič na kuchyňský dřez', 'Měřič na koupelnu']
	};
	return {
		occupantId,
		name: name ?? faker.helpers.arrayElement(names[energyType]),
		energyType
	};
}
