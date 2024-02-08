import { createBuilding } from '$lib/models';
import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { z } from 'zod';

const schema = z.object({
  name: z.coerce.string(),
  squareMeters: z.coerce.number(),
});

export const actions = {
	default: async (event) => {
    const formData = await event.request.formData();
    const data = Object.fromEntries(formData);

    const { name, squareMeters } = schema.parse(data);

    const building = createBuilding({ name, squareMeters });

    console.log('Created building', building);

    return redirect(302, `/building/${building.id}`)
  }
} satisfies Actions;
