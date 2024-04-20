import { relations } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { metadataColumns, primaryIdColumn } from './common';
import { energyBills } from './energy-bill';
import { occupants } from './occupant';

// -- Table definition --

/**
 * Building represents a real-world building. It is a root domain entity serving
 * as a container for all the other data.
 * Measuring consumptions and billing only makes sense in the context of a building.
 */
export const buildings = sqliteTable('buildings', {
	// Keys
	id: primaryIdColumn,
	// Meta
	...metadataColumns,
	// Basic properties
	name: text('name').notNull(),
	squareMeters: integer('squareMeters')
});

// -- Relations --

export const buildingsRelations = relations(buildings, ({ many }) => ({
	/** It can have many occupants */
	occupants: many(occupants),
	/**
	 * It can have many energy bills, each contains a bill
	 * for the total consumption of the entire building
	 */
	energyBills: many(energyBills)
}));

// -- Schemas --

export const selectBuildingSchema = createSelectSchema(buildings, {
	id: (schema) => schema.id.brand<'ID'>()
});

export const insertBuildingSchema = createInsertSchema(buildings, {
	id: (schema) => schema.id.brand<'ID'>(),
	name: (schema) => schema.name.trim().min(1),
	squareMeters: z.coerce.number().optional()
});

// -- Helper types --

export type Building = typeof buildings.$inferSelect;
export type BuildingInsert = typeof buildings.$inferInsert;
