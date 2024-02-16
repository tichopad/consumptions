import { energyTypes, id, type ID } from '../../helpers';
import { relations } from 'drizzle-orm';
import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

// -- Column types --

const primaryIdColumn = text('id').primaryKey().notNull().$defaultFn(id).$type<ID>();
const booleanColumn = (colName: string) => integer(colName, { mode: 'boolean' });

// -- Building --

export const buildings = sqliteTable('buildings', {
	id: primaryIdColumn,
	name: text('name').notNull(),
	squareMeters: integer('squareMeters')
});

export const buildingsRelations = relations(buildings, ({ many }) => ({
	occupants: many(occupants),
	energyBills: many(energyBills)
}));

export const selectBuildingSchema = createSelectSchema(buildings, {
	id: (schema) => schema.id.brand<'ID'>()
});
export const insertBuildingSchema = createInsertSchema(buildings, {
	id: (schema) => schema.id.brand<'ID'>(),
	squareMeters: z.coerce.number().optional()
});

export type Building = typeof buildings.$inferSelect;
export type BuildingInsert = typeof buildings.$inferInsert;

// -- Occupant --

export const occupants = sqliteTable('occupants', {
	id: primaryIdColumn,
	name: text('name').notNull(),
	squareMeters: integer('squareMeters').notNull(),
	chargedUnmeasuredElectricity: booleanColumn('chargedUnmeasuredElectricity')
		.notNull()
		.default(false),
	chargedUnmeasuredHeating: booleanColumn('chargedUnmeasuredHeating').notNull().default(false),
	chargedUnmeasuredWater: booleanColumn('chargedUnmeasuredWater').notNull().default(false),
	heatingFixedCostShare: real('heatingFixedCostShare'),
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
	buildingId: (schema) => schema.buildingId.brand<'ID'>(),
	chargedUnmeasuredElectricity: z.coerce.boolean().optional().default(false),
	chargedUnmeasuredHeating: z.coerce.boolean().optional().default(false),
	chargedUnmeasuredWater: z.coerce.boolean().optional().default(false),
	heatingFixedCostShare: z.coerce.number().optional(),
	squareMeters: z.coerce.number()
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
	measuringDeviceId: (schema) => schema.measuringDeviceId.brand<'ID'>(),
	unmeasured: z.coerce.boolean().optional().default(false),
	consumption: z.coerce.number().optional()
});

export type ConsumptionRecord = typeof consumptionRecords.$inferSelect;
export type ConsumptionRecordInsert = typeof consumptionRecords.$inferInsert;

// -- Energy Bill --

export const energyBills = sqliteTable('energyBills', {
	id: primaryIdColumn,
	energyType: text('energyType', { enum: energyTypes }).notNull(),
	totalCost: real('totalCost').notNull(),
	fixedCost: real('fixedCost'),
	startDate: integer('startDate', { mode: 'timestamp' }).notNull(),
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
	buildingId: (schema) => schema.buildingId.brand<'ID'>(),
	totalCost: z.coerce.number(),
	fixedCost: z.coerce.number().optional()
});

export type EnergyBill = typeof energyBills.$inferSelect;
export type EnergyBillInsert = typeof energyBills.$inferInsert;
