import { relations } from 'drizzle-orm';
import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { buildings } from './building';
import {
	archiveColumns,
	booleanColumn,
	metadataColumns,
	primaryIdColumn,
	softDeleteColumns,
	type ID
} from './common';
import { energyBills } from './energy-bill';
import { measuringDevices } from './measuring-device';

// -- Table definition --

/**
 * Occupant represents a single person or a company renting or owning an area within a building.
 */
export const occupants = sqliteTable('occupants', {
	// Keys
	id: primaryIdColumn,
	// Metadata
	...metadataColumns,
	...softDeleteColumns,
	...archiveColumns,
	// Basic properties
	name: text('name').notNull(),
	squareMeters: integer('squareMeters').notNull(),
	// Are they charged their energy consumption based on their occupied area? (Usual with renters)
	chargedUnmeasuredElectricity: booleanColumn('chargedUnmeasuredElectricity')
		.notNull()
		.default(false),
	chargedUnmeasuredHeating: booleanColumn('chargedUnmeasuredHeating').notNull().default(false),
	chargedUnmeasuredWater: booleanColumn('chargedUnmeasuredWater').notNull().default(false),
	// Some occupants (usually owners) participate in the fixed portion of heating costs
	heatingFixedCostShare: real('heatingFixedCostShare'),
	// References
	buildingId: text('buildingId')
		.notNull()
		.references(() => buildings.id)
		.$type<ID>()
});

// -- Relations --

export const occupantsRelations = relations(occupants, ({ one, many }) => ({
	/** Is belongs to a building */
	buildings: one(buildings, {
		fields: [occupants.buildingId],
		references: [buildings.id]
	}),
	/** It can have many measuring devices */
	measuringDevices: many(measuringDevices),
	/** It can have many energy consumption bills */
	energyBills: many(energyBills)
}));

// -- Validation schemas --

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

// -- Helper types --

export type Occupant = typeof occupants.$inferSelect;
export type OccupantInsert = typeof occupants.$inferInsert;
