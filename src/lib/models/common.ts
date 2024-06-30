import { sql } from 'drizzle-orm';
import { integer, text } from 'drizzle-orm/sqlite-core';
import { customAlphabet } from 'nanoid';
import type { z } from 'zod';

// -- ID --

// Branded ID type
export type ID = string & z.BRAND<'ID'>;

// Custom ID generator alphabet; 11 characters long and URL-safe
const createId = customAlphabet(
	'0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
	16
);

/** Creates unique ID */
export const id = () => createId() as ID;

// -- Energy Types --

/** Supported energy types */
export const energyTypes = ['electricity', 'heating', 'water'] as const;
export type EnergyType = (typeof energyTypes)[number];

/** Units for each energy type */
export const unitsByEnergyType = {
	electricity: 'kWh',
	water: 'm³',
	heating: 'GJ'
} as const satisfies Record<EnergyType, string>;

/** Human-readable labels for each energy type */
export const labelsByEnergyType = {
	electricity: 'Elektřina',
	water: 'Voda',
	heating: 'Teplo'
} as const satisfies Record<EnergyType, string>;

// -- Column types --

/** Defines primary ID column in a Drizzle table definition for SQLite */
export const primaryIdColumn = text('id').primaryKey().notNull().$defaultFn(id).$type<ID>();

/** Defines a boolean column in a Drizzle table definition for SQLite */
export const booleanColumn = (columnName: string) => integer(columnName, { mode: 'boolean' });

/** Defines a set of columns representing basic metadata */
export const metadataColumns = {
	created: integer('created', { mode: 'timestamp' })
		.notNull()
		.default(sql`(strftime('%s','now'))`),
	updated: integer('updated', { mode: 'timestamp' })
		.notNull()
		.default(sql`(strftime('%s','now'))`)
		.$onUpdate(() => new Date())
};

/** Defines a set of columns representing the ability for a record to be soft-deleted */
export const softDeleteColumns = {
	isDeleted: booleanColumn('isDeleted').notNull().default(false),
	deleted: integer('deleted', { mode: 'timestamp' })
};
