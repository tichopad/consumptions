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
	schema: './src/lib/models/schema.ts',
	out: './drizzle/migrations',
	driver: 'turso',
	dbCredentials: {
		url: env.DATABASE_URL,
		authToken: env.DATABASE_AUTH_TOKEN
	}
} satisfies Config;
