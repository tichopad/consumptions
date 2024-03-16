import { getElectricityCostForOccupant } from '$lib/bills/electricity';
import {
	insertMeasuringDeviceSchema,
	occupants,
	selectMeasuringDeviceSchema,
	selectOccupantSchema,
	type ConsumptionRecordInsert,
	consumptionRecords
} from '$lib/models/schema';
import { db } from '$lib/server/db/client';
import { fail, type Actions, type Load } from '@sveltejs/kit';
import { asc } from 'drizzle-orm';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { z } from 'zod';

const formSchema = z.object({
	// Dates
	startDate: z.coerce.date(),
	endDate: z.coerce.date(),
	// Energy unit costs
	electricityUnitCost: z.coerce.number(),
	waterUnitCost: z.coerce.number(),
	heatingUnitCost: z.coerce.number(),
	// Total costs
	electricityTotalCost: z.coerce.number(),
	waterTotalCost: z.coerce.number(),
	heatingTotalCost: z.coerce.number(),
	heatingTotalFixedCost: z.coerce.number().optional(),
	// Occupants
	occupants: z
		.object({
			id: selectOccupantSchema.shape.id,
			buildingId: selectOccupantSchema.shape.buildingId,
			name: z.string(),
			chargedUnmeasuredElectricity: z.coerce.boolean(),
			chargedUnmeasuredHeating: z.coerce.boolean(),
			chargedUnmeasuredWater: z.coerce.boolean(),
			heatingFixedCostShare: z.coerce.number().nullable(),
			squareMeters: z.coerce.number(),
			measuringDevices: z
				.object({
					id: selectMeasuringDeviceSchema.shape.id,
					energyType: insertMeasuringDeviceSchema.shape.energyType,
					name: z.string(),
					consumption: z.coerce.number().optional()
				})
				.array()
		})
		.array()
});
type FormSchema = z.infer<typeof formSchema>;

export const load: Load = async () => {
	const occupantsList = await db.query.occupants.findMany({
		orderBy: asc(occupants.name),
		with: {
			measuringDevices: true
		}
	});

	const defaultOccupants: FormSchema['occupants'] = occupantsList.map((occupant) => {
		return {
			id: occupant.id,
			buildingId: occupant.buildingId,
			name: occupant.name,
			chargedUnmeasuredElectricity: occupant.chargedUnmeasuredElectricity,
			chargedUnmeasuredHeating: occupant.chargedUnmeasuredHeating,
			chargedUnmeasuredWater: occupant.chargedUnmeasuredWater,
			heatingFixedCostShare: occupant.heatingFixedCostShare,
			squareMeters: occupant.squareMeters,
			measuringDevices: occupant.measuringDevices.map((device) => ({
				id: device.id,
				energyType: device.energyType,
				name: device.name
			}))
		};
	});

	return {
		form: await superValidate({ occupants: defaultOccupants }, zod(formSchema)),
		occupants: occupantsList
	};
};

export const actions: Actions = {
	createBill: async (event) => {
		console.log('eyy');

		const form = await superValidate(event, zod(formSchema));

		console.log(form);

		if (!form.valid) return fail(400, { form });

		console.log(JSON.stringify(form.data, null, 2));

		for (const occupant of form.data.occupants) {
			const electricityConsumptionRecordInserts: ConsumptionRecordInsert[] =
				occupant.measuringDevices.map((device) => {
					return {
						measuringDeviceId: device.id,
						startDate: form.data.startDate,
						endDate: form.data.endDate,
						consumption: device.consumption ?? 0
					};
				});
			const electricityConsumptionRecords = await db
				.insert(consumptionRecords)
				.values(electricityConsumptionRecordInserts)
				.returning();
		}

		return { form };
	}
};
