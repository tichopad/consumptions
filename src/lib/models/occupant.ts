import { relations } from 'drizzle-orm';
import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { buildings } from './building';
import { booleanColumn, primaryIdColumn, softDeleteColumn, type ID } from './common';
import { energyBills } from './energy-bill';
import { measuringDevices } from './measuring-device';

// Table definition

export const occupants = sqliteTable('occupants', {
	id: primaryIdColumn,
	name: text('name').notNull(),
	isDeleted: softDeleteColumn,
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

// Relations

export const occupantsRelations = relations(occupants, ({ one, many }) => ({
	buildings: one(buildings, {
		fields: [occupants.buildingId],
		references: [buildings.id]
	}),
	measuringDevices: many(measuringDevices),
	energyBills: many(energyBills)
}));

// Validation schemas

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
	name: (schema) => schema.name.trim().min(1),
	squareMeters: z.coerce.number()
});

// Types

export type Occupant = typeof occupants.$inferSelect;
export type OccupantInsert = typeof occupants.$inferInsert;
