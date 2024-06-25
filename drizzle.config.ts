import type { Config } from 'drizzle-kit';
import { z } from 'zod';

// Get environment variables
const env = z
	.object({
		DATABASE_URL: z.string(),
		DATABASE_AUTH_TOKEN: z.string().optional()
	})
	.parse(process.env);

export default {
	dialect: 'sqlite',
	dbCredentials: {
		url: env.DATABASE_URL,
		authToken: env.DATABASE_AUTH_TOKEN || undefined // No empty strings here
	},
	driver: 'turso',
	out: './drizzle/migrations',
	schema: './src/lib/models/schema.ts'
} satisfies Config;
