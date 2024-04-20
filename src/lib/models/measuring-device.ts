import { relations } from 'drizzle-orm';
import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import {
	energyTypes,
	metadataColumns,
	primaryIdColumn,
	softDeleteColumns,
	type ID
} from './common';
import { consumptionRecords } from './consumption-record';
import { occupants } from './occupant';

// -- Table definition --

/**
 * Measuring device represents a real-world device used for measuring of energy
 * consumption.
 */
export const measuringDevices = sqliteTable('measuringDevices', {
	// Keys
	id: primaryIdColumn,
	// Metadata
	...metadataColumns,
	...softDeleteColumns,
	// Basic properties
	name: text('name').notNull(),
	energyType: text('energyType', { enum: energyTypes }).notNull(),
	// References
	occupantId: text('occupantId')
		.notNull()
		.references(() => occupants.id)
		.$type<ID>()
});

// -- Relations --

export const measuringDevicesRelations = relations(measuringDevices, ({ one, many }) => ({
	/** It belongs to an occupant */
	occupants: one(occupants, {
		fields: [measuringDevices.occupantId],
		references: [occupants.id]
	}),
	/** It can contain many consumption records (containers for discrete measurements) */
	consumptionRecords: many(consumptionRecords)
}));

// -- Validation schemas --

export const selectMeasuringDeviceSchema = createSelectSchema(measuringDevices, {
	id: (schema) => schema.id.brand<'ID'>(),
	occupantId: (schema) => schema.occupantId.brand<'ID'>()
});

export const insertMeasuringDeviceSchema = createInsertSchema(measuringDevices, {
	id: (schema) => schema.id.brand<'ID'>(),
	occupantId: (schema) => schema.occupantId.brand<'ID'>(),
	name: (schema) => schema.name.trim().min(1)
});

// -- Helper types --

export type MeasuringDevice = typeof measuringDevices.$inferSelect;
export type MeasuringDeviceInsert = typeof measuringDevices.$inferInsert;
