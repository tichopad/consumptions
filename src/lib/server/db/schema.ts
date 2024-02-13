import { relations, sql } from 'drizzle-orm';
import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import hyperid from 'hyperid';

// -- ID --

type ID = { __brand: 'ID' } & string;
const createId = hyperid({ urlSafe: true });
const id = () => createId() as ID;
const primaryIdColumn = text('id').primaryKey().notNull().$defaultFn(id).$type<ID>();

// -- Boolean --

const booleanColumn = (colName: string) => integer(colName, { mode: 'boolean' });

// -- Energy Types --

const energyTypes = ['electricity', 'heating', 'water'] as const;
export type EnergyType = (typeof energyTypes)[number];

// -- Building --

export const buildings = sqliteTable('buildings', {
	id: primaryIdColumn,
	name: text('name').notNull(),
	squareMeters: text('squareMeters').notNull()
});

export type Building = typeof buildings.$inferSelect;
export type BuildingInsert = typeof buildings.$inferInsert;

export const buildingsRelations = relations(buildings, ({ many }) => ({
	occupants: many(occupants, {
		relationName: 'occupants'
	})
}));

// -- Occupant --

export const occupants = sqliteTable('occupants', {
	id: primaryIdColumn,
	name: text('name').notNull(),
	squareMeters: text('squareMeters').notNull(),
	chargedUnmeasuredElectricity: booleanColumn('chargedUnmeasuredElectricity')
		.notNull()
		.default(false),
	chargedUnmeasuredHeating: booleanColumn('chargedUnmeasuredHeating').notNull().default(false),
	chargedUnmeasuredWater: booleanColumn('chargedUnmeasuredWater').notNull().default(false),
	heatingFixedCostShare: integer('heatingFixedCostShare'),
	buildingId: text('buildingId')
		.notNull()
		.references(() => buildings.id)
		.$type<ID>()
});

export const occupantsRelations = relations(occupants, ({ one, many }) => ({
	buildings: one(buildings, {
		relationName: 'building',
		fields: [occupants.buildingId],
		references: [buildings.id]
	}),
	measuringDevices: many(measuringDevices)
}));

export type Occupant = typeof occupants.$inferSelect;
export type OccupantInsert = typeof occupants.$inferInsert;

// -- Measuring Device --

export const measuringDevices = sqliteTable('measuringDevices', {
	id: primaryIdColumn,
	name: text('name').notNull(),
	energyType: text('energyType', { enum: energyTypes }).notNull(),
	occupantId: text('occupantId')
		.notNull()
		.references(() => occupants.id)
		.$type<ID>()
});

export const measuringDevicesRelations = relations(measuringDevices, ({ one, many }) => ({
	occupants: one(occupants, {
		relationName: 'occupant',
		fields: [measuringDevices.occupantId],
		references: [occupants.id]
	}),
	consumptionRecords: many(consumptionRecords, {
		relationName: 'consumptionRecords'
	})
}));

export type MeasuringDevice = typeof measuringDevices.$inferSelect;
export type MeasuringDeviceInsert = typeof measuringDevices.$inferInsert;

// -- Consumption Record --

export const consumptionRecords = sqliteTable('consumptionRecords', {
	id: primaryIdColumn,
	startDate: text('startDate')
		.notNull()
		.default(sql`CURRENT_DATE`),
	endDate: text('endDate')
		.notNull()
		.default(sql`CURRENT_DATE`),
	unmeasured: booleanColumn('unmeasured').notNull().default(false),
	consumption: real('consumption'),
	measuringDeviceId: text('measuringDeviceId')
		.references(() => measuringDevices.id)
		.$type<ID>()
});

export const consumptionRecordsRelations = relations(consumptionRecords, ({ one }) => ({
	measuringDevices: one(measuringDevices, {
		relationName: 'measuringDevice',
		fields: [consumptionRecords.measuringDeviceId],
		references: [measuringDevices.id]
	})
}));

export type ConsumptionRecord = typeof consumptionRecords.$inferSelect;
export type ConsumptionRecordInsert = typeof consumptionRecords.$inferInsert;

// -- Energy Bill --

export const energyBills = sqliteTable('energyBills', {
	id: primaryIdColumn,
	energyType: text('energyType', { enum: energyTypes }).notNull(),
	totalCost: real('totalCost').notNull(),
	fixedCost: real('fixedCost'),
	startDate: text('startDate')
		.notNull()
		.default(sql`CURRENT_DATE`),
	endDate: text('endDate')
		.notNull()
		.default(sql`CURRENT_DATE`),
	buildingId: text('buildingId')
		.notNull()
		.references(() => buildings.id)
		.$type<ID>()
});

export const energyBillsRelations = relations(energyBills, ({ one }) => ({
	buildings: one(buildings, {
		relationName: 'building',
		fields: [energyBills.buildingId],
		references: [buildings.id]
	})
}));

export type EnergyBill = typeof energyBills.$inferSelect;
export type EnergyBillInsert = typeof energyBills.$inferInsert;
