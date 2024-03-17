import { integer, text } from 'drizzle-orm/sqlite-core';
import { customAlphabet } from 'nanoid';
import type { z } from 'zod';

// -- ID --

export type ID = string & z.BRAND<'ID'>;
const createId = customAlphabet(
	'0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
	11
);
export const id = () => createId() as ID;

// -- Energy Types --

export const energyTypes = ['electricity', 'heating', 'water'] as const;
export type EnergyType = (typeof energyTypes)[number];

// -- Column types --

export const primaryIdColumn = text('id').primaryKey().notNull().$defaultFn(id).$type<ID>();
export const booleanColumn = (colName: string) => integer(colName, { mode: 'boolean' });
