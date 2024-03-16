import { buildings, occupants } from '$lib/models/schema';
import { db } from '$lib/server/db/client';
import { describe, it, expect } from 'vitest';

describe('Electricity bill calculation', () => {
	it('does a thing', async () => {
		const [b] = await db.insert(buildings).values({ name: 'Home' }).returning();
		const [o1, o2] = await db
			.insert(occupants)
			.values([
				{ buildingId: b.id, name: 'Alice', squareMeters: 52, chargedUnmeasuredElectricity: true },
				{ buildingId: b.id, name: 'Bob', squareMeters: 39, chargedUnmeasuredElectricity: true }
			])
			.returning();
		console.log(o1, o2);
		expect(o1).toBeDefined();
	});
});
