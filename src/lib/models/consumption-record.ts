import { relations } from 'drizzle-orm';
import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { primaryIdColumn, type ID, energyTypes } from './common';
import { measuringDevices } from './measuring-device';

// Table definition

export const consumptionRecords = sqliteTable('consumptionRecords', {
	id: primaryIdColumn,
	startDate: integer('startDate', { mode: 'timestamp' }).notNull(),
	endDate: integer('endDate', { mode: 'timestamp' }).notNull(),
	energyType: text('energyType', { enum: energyTypes }).notNull(),
	consumption: real('consumption').notNull(),
	measuringDeviceId: text('measuringDeviceId')
		.notNull()
		.references(() => measuringDevices.id)
		.$type<ID>()
});

// Relations

export const consumptionRecordsRelations = relations(consumptionRecords, ({ one }) => ({
	measuringDevices: one(measuringDevices, {
		fields: [consumptionRecords.measuringDeviceId],
		references: [measuringDevices.id]
	})
}));

// Validation schemas

export const selectConsumptionRecordSchema = createSelectSchema(consumptionRecords, {
	id: (schema) => schema.id.brand<'ID'>(),
	measuringDeviceId: (schema) => schema.measuringDeviceId.brand<'ID'>()
});
export const insertConsumptionRecordSchema = createInsertSchema(consumptionRecords, {
	id: (schema) => schema.id.brand<'ID'>(),
	measuringDeviceId: (schema) => schema.measuringDeviceId.brand<'ID'>(),
	consumption: z.coerce.number()
});

// Types

export type ConsumptionRecord = typeof consumptionRecords.$inferSelect;
export type ConsumptionRecordInsert = typeof consumptionRecords.$inferInsert;
