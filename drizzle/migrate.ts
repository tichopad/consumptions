import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';
import { z } from 'zod';

// Get environment variables
const env = z
	.object({
		DATABASE_URL: z.string(),
		DATABASE_AUTH_TOKEN: z.string().optional()
	})
	.parse(process.env);

const db = drizzle(createClient({ url: env.DATABASE_URL, authToken: env.DATABASE_AUTH_TOKEN }));

try {
	await migrate(db, { migrationsFolder: 'drizzle/migrations' });
	console.log('Tables migrated!');
	process.exit(0);
} catch (error) {
	console.error('Error performing migration: ', error);
	process.exit(1);
}
