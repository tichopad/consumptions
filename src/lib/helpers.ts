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
