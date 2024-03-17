import { relations } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { primaryIdColumn } from './common';
import { energyBills } from './energy-bill';
import { occupants } from './occupant';

// Table definition

export const buildings = sqliteTable('buildings', {
	id: primaryIdColumn,
	name: text('name').notNull(),
	squareMeters: integer('squareMeters')
});

// Relations

export const buildingsRelations = relations(buildings, ({ many }) => ({
	occupants: many(occupants),
	energyBills: many(energyBills)
}));

// Schemas

export const selectBuildingSchema = createSelectSchema(buildings, {
	id: (schema) => schema.id.brand<'ID'>()
});

export const insertBuildingSchema = createInsertSchema(buildings, {
	id: (schema) => schema.id.brand<'ID'>(),
	name: (schema) => schema.name.trim().min(1),
	squareMeters: z.coerce.number().optional()
});

// Types

export type Building = typeof buildings.$inferSelect;
export type BuildingInsert = typeof buildings.$inferInsert;
