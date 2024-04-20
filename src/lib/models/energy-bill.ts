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
	// Cost
	totalCost: real('totalCost').notNull(),
	fixedCost: real('fixedCost'),
	// Consumption
	energyType: text('energyType', { enum: energyTypes }).notNull(),
	totalConsumption: real('consumption'), // Not required because of occupants without measuring devices
	// Date
	startDate: integer('startDate', { mode: 'timestamp' }).notNull(),
	endDate: integer('endDate', { mode: 'timestamp' }).notNull(),
	// References
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
	/** It exists in the context of a building */
	buildings: one(buildings, {
		fields: [energyBills.buildingId],
		references: [buildings.id]
	}),
	/** It belongs to an occupant */
	occupants: one(occupants, {
		fields: [energyBills.occupantId],
		references: [occupants.id]
	}),
	/** It is created in the context of a billing period */
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
