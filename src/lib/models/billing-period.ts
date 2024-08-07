import { relations } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { createSelectSchema } from 'drizzle-zod';
import { buildings } from './building';
import {
	archiveColumns,
	metadataColumns,
	primaryIdColumn,
	softDeleteColumns,
	type ID
} from './common';
import { energyBills } from './energy-bill';

// -- Table definition --

/**
 * Billing period is a container for many discrete billings in
 * a given time-frame.
 */
export const billingPeriods = sqliteTable('billingPeriods', {
	// Keys
	id: primaryIdColumn,
	// Meta
	...metadataColumns,
	...softDeleteColumns,
	...archiveColumns,
	// Date
	startDate: integer('startDate', { mode: 'timestamp' }).notNull(),
	endDate: integer('endDate', { mode: 'timestamp' }).notNull(),
	// References
	buildingId: text('buildingId')
		.notNull()
		.references(() => buildings.id)
		.$type<ID>()
});

// -- Relations --

export const billingPeriodsRelations = relations(billingPeriods, ({ one, many }) => ({
	/** It exists in the context of a building */
	buildings: one(buildings, {
		fields: [billingPeriods.buildingId],
		references: [buildings.id]
	}),
	/** It contains many bills */
	energyBills: many(energyBills)
}));

// -- Validation schemas --

export const selectBillingPeriodSchema = createSelectSchema(billingPeriods, {
	id: (schema) => schema.id.brand<'ID'>(),
	buildingId: (schema) => schema.buildingId.brand<'ID'>()
});

export const insertBillingPeriodSchema = createSelectSchema(billingPeriods, {
	id: (schema) => schema.id.brand<'ID'>(),
	buildingId: (schema) => schema.buildingId.brand<'ID'>()
});

// -- Helper types --

export type BillingPeriod = typeof billingPeriods.$inferSelect;
export type BillingPeriodInsert = typeof billingPeriods.$inferInsert;
