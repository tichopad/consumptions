import { relations } from 'drizzle-orm';
import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import hyperid from 'hyperid';
import { z } from 'zod';

// -- ID --

export type ID = string & z.BRAND<'ID'>;
const createId = hyperid({ urlSafe: true });
export const id = () => createId() as ID;
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

export const buildingsRelations = relations(buildings, ({ many }) => ({
	occupants: many(occupants),
	energyBills: many(energyBills)
}));

export const selectBuildingSchema = createSelectSchema(buildings, {
	id: (schema) => schema.id.brand<'ID'>()
});
export const insertBuildingSchema = createInsertSchema(buildings, {
	id: (schema) => schema.id.brand<'ID'>()
});

export type Building = typeof buildings.$inferSelect;
export type BuildingInsert = typeof buildings.$inferInsert;

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
		fields: [occupants.buildingId],
		references: [buildings.id]
	}),
	measuringDevices: many(measuringDevices)
}));

export const selectOccupantSchema = createSelectSchema(occupants, {
	id: (schema) => schema.id.brand<'ID'>(),
	buildingId: (schema) => schema.buildingId.brand<'ID'>()
});
export const insertOccupantSchema = createInsertSchema(occupants, {
	id: (schema) => schema.id.brand<'ID'>(),
	buildingId: (schema) => schema.buildingId.brand<'ID'>()
});

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
		fields: [measuringDevices.occupantId],
		references: [occupants.id]
	}),
	consumptionRecords: many(consumptionRecords)
}));

export const selectMeasuringDeviceSchema = createSelectSchema(measuringDevices, {
	id: (schema) => schema.id.brand<'ID'>(),
	occupantId: (schema) => schema.occupantId.brand<'ID'>()
});
export const insertMeasuringDeviceSchema = createInsertSchema(measuringDevices, {
	id: (schema) => schema.id.brand<'ID'>(),
	occupantId: (schema) => schema.occupantId.brand<'ID'>()
});

export type MeasuringDevice = typeof measuringDevices.$inferSelect;
export type MeasuringDeviceInsert = typeof measuringDevices.$inferInsert;

// -- Consumption Record --

export const consumptionRecords = sqliteTable('consumptionRecords', {
	id: primaryIdColumn,
	startDate: integer('startDate', { mode: 'timestamp' }).notNull(),
	endDate: integer('endDate', { mode: 'timestamp' }).notNull(),
	unmeasured: booleanColumn('unmeasured').notNull().default(false),
	consumption: real('consumption'),
	measuringDeviceId: text('measuringDeviceId')
		.references(() => measuringDevices.id)
		.$type<ID>()
});

export const consumptionRecordsRelations = relations(consumptionRecords, ({ one }) => ({
	measuringDevices: one(measuringDevices, {
		fields: [consumptionRecords.measuringDeviceId],
		references: [measuringDevices.id]
	})
}));

export const selectConsumptionRecordSchema = createSelectSchema(consumptionRecords, {
	id: (schema) => schema.id.brand<'ID'>(),
	measuringDeviceId: (schema) => schema.measuringDeviceId.brand<'ID'>()
});
export const insertConsumptionRecordSchema = createInsertSchema(consumptionRecords, {
	id: (schema) => schema.id.brand<'ID'>(),
	measuringDeviceId: (schema) => schema.measuringDeviceId.brand<'ID'>()
});

export type ConsumptionRecord = typeof consumptionRecords.$inferSelect;
export type ConsumptionRecordInsert = typeof consumptionRecords.$inferInsert;

// -- Energy Bill --

export const energyBills = sqliteTable('energyBills', {
	id: primaryIdColumn,
	energyType: text('energyType', { enum: energyTypes }).notNull(),
	totalCost: real('totalCost').notNull(),
	fixedCost: real('fixedCost'),
	startDate: integer('startDate', { mode: 'timestamp' }) //TODO: validate it's a date
		.notNull(),
	endDate: integer('endDate', { mode: 'timestamp' }).notNull(),
	buildingId: text('buildingId')
		.notNull()
		.references(() => buildings.id)
		.$type<ID>()
});

export const energyBillsRelations = relations(energyBills, ({ one }) => ({
	buildings: one(buildings, {
		fields: [energyBills.buildingId],
		references: [buildings.id]
	})
}));

export const selectEnergyBillSchema = createSelectSchema(energyBills, {
	id: (schema) => schema.id.brand<'ID'>(),
	buildingId: (schema) => schema.buildingId.brand<'ID'>()
});
export const insertEnergyBillSchema = createInsertSchema(energyBills, {
	id: (schema) => schema.id.brand<'ID'>(),
	buildingId: (schema) => schema.buildingId.brand<'ID'>()
});

export type EnergyBill = typeof energyBills.$inferSelect;
export type EnergyBillInsert = typeof energyBills.$inferInsert;
