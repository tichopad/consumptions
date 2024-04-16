import { relations } from 'drizzle-orm';
import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { energyTypes, primaryIdColumn, softDeleteColumn, type ID } from './common';
import { consumptionRecords } from './consumption-record';
import { occupants } from './occupant';

// Table definition

export const measuringDevices = sqliteTable('measuringDevices', {
	id: primaryIdColumn,
	name: text('name').notNull(),
	isDeleted: softDeleteColumn,
	energyType: text('energyType', { enum: energyTypes }).notNull(),
	occupantId: text('occupantId')
		.notNull()
		.references(() => occupants.id)
		.$type<ID>()
});

// Relations

export const measuringDevicesRelations = relations(measuringDevices, ({ one, many }) => ({
	occupants: one(occupants, {
		fields: [measuringDevices.occupantId],
		references: [occupants.id]
	}),
	consumptionRecords: many(consumptionRecords)
}));

// Validation schemas

export const selectMeasuringDeviceSchema = createSelectSchema(measuringDevices, {
	id: (schema) => schema.id.brand<'ID'>(),
	occupantId: (schema) => schema.occupantId.brand<'ID'>()
});

export const insertMeasuringDeviceSchema = createInsertSchema(measuringDevices, {
	id: (schema) => schema.id.brand<'ID'>(),
	occupantId: (schema) => schema.occupantId.brand<'ID'>(),
	name: (schema) => schema.name.trim().min(1)
});

// Types

export type MeasuringDevice = typeof measuringDevices.$inferSelect;
export type MeasuringDeviceInsert = typeof measuringDevices.$inferInsert;
