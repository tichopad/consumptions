import { relations } from 'drizzle-orm';
import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { energyTypes, primaryIdColumn, type ID } from './common';
import { buildings } from './building';
import { occupants } from './occupant';
import { billingPeriods } from './billing-period';

// Table definition

export const energyBills = sqliteTable('energyBills', {
	id: primaryIdColumn,
	energyType: text('energyType', { enum: energyTypes }).notNull(),
	totalCost: real('totalCost').notNull(),
	fixedCost: real('fixedCost'),
	startDate: integer('startDate', { mode: 'timestamp' }).notNull(),
	endDate: integer('endDate', { mode: 'timestamp' }).notNull(),
	buildingId: text('buildingId')
		.references(() => buildings.id)
		.$type<ID>(),
	occupantId: text('occupantId')
		.references(() => occupants.id)
		.$type<ID>(),
	billingPeriodId: text('billingPeriodId')
		.notNull()
		.references(() => billingPeriods.id)
		.$type<ID>()
});

// Relations

export const energyBillsRelations = relations(energyBills, ({ one }) => ({
	buildings: one(buildings, {
		fields: [energyBills.buildingId],
		references: [buildings.id]
	}),
	occupants: one(occupants, {
		fields: [energyBills.occupantId],
		references: [occupants.id]
	}),
	billingPeriods: one(billingPeriods, {
		fields: [energyBills.billingPeriodId],
		references: [billingPeriods.id]
	})
}));

// Validation schemas

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

// Types

export type EnergyBill = typeof energyBills.$inferSelect;
export type EnergyBillInsert = typeof energyBills.$inferInsert;
