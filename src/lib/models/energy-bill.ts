import { relations } from 'drizzle-orm';
import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { billingPeriods } from './billing-period';
import { buildings } from './building';
import { energyTypes, primaryIdColumn, type ID } from './common';
import { occupants } from './occupant';

// -- Table definition --

/**
 * Energy bill represents a separate bill for energy consumption in the context of a specific billing period (time).
 *
 * It can either belong to an occupant or a building as a whole. In the second case, it defines the bill for total energy
 * consumption of the entire building, which should always equal the sum of all occupants' consumption.
 */
export const energyBills = sqliteTable('energyBills', {
	// Keys
	id: primaryIdColumn,
	// Costs
	totalCost: real('totalCost').notNull(),
	fixedCost: real('fixedCost'), // Fixed cost only makes sense for heating
	costPerUnit: real('costPerUnit'), // Cost per unit of energy for measured consumptions
	costPerSquareMeter: real('costPerSquareMeter'), // Cost per squared meter for unmeasured consumptions
	// Consumption & type
	energyType: text('energyType', { enum: energyTypes }).notNull(),
	totalConsumption: real('consumption'), // Not required because of occupants without measuring devices
	billedArea: real('billedArea'), // Area used for calculating unmeasured consumption
	// Date (should always match the start & end of the billing period)
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

// -- Relations --

export const energyBillsRelations = relations(energyBills, ({ one }) => ({
	/** It can belong to a building as a total consumption bill */
	buildings: one(buildings, {
		fields: [energyBills.buildingId],
		references: [buildings.id]
	}),
	/** It can belong to an occupant */
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

// -- Validation schemas --

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

// -- Helper types --

export type EnergyBill = typeof energyBills.$inferSelect;
export type EnergyBillInsert = typeof energyBills.$inferInsert;
