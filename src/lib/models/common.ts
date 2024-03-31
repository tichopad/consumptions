import { integer, text } from 'drizzle-orm/sqlite-core';
import { customAlphabet } from 'nanoid';
import type { z } from 'zod';

// -- ID --

// Branded ID type
export type ID = string & z.BRAND<'ID'>;

// Custom ID generator alphabet; 11 characters long and URL-safe
const createId = customAlphabet(
	'0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
	11
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
	electricity: 'Electricity',
	water: 'Water',
	heating: 'Heating'
} as const satisfies Record<EnergyType, string>;

// -- Column types --

/** Defines primary ID column in a Drizzle table definition for SQLite */
export const primaryIdColumn = text('id').primaryKey().notNull().$defaultFn(id).$type<ID>();

/** Defines a boolean column in a Drizzle table definition for SQLite */
export const booleanColumn = (columnName: string) => integer(columnName, { mode: 'boolean' });
