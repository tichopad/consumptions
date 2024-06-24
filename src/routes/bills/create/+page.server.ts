import { calculateBills } from '$lib/bills/calculate';
import {
	billingPeriods,
	consumptionRecords,
	energyBills,
	insertMeasuringDeviceSchema,
	occupants,
	selectMeasuringDeviceSchema,
	selectOccupantSchema,
	type ConsumptionRecordInsert,
	type EnergyBillInsert,
	type ID
} from '$lib/models/schema';
import { db } from '$lib/server/db/client';
import { assert } from '$lib/utils';
import { fail, redirect, type Actions, type Load } from '@sveltejs/kit';
import { asc, eq } from 'drizzle-orm';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { z } from 'zod';

const formSchema = z.object({
	// Dates
	dateRange: z.object({
		start: z.coerce.date(),
		end: z.coerce.date()
	}),
	electricityTotalConsumption: z.coerce.number(),
	waterTotalConsumption: z.coerce.number(),
	heatingTotalConsumption: z.coerce.number(),
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
		console.group('createBill');

		const form = await superValidate(event, zod(formSchema));

		if (!form.valid) return fail(400, { form });

		const building = await db.query.buildings.findFirst();

		if (building === undefined) {
			return fail(500, { form, message: 'No building found' });
		}

		const [billingPeriod] = await db
			.insert(billingPeriods)
			.values({
				buildingId: building.id,
				startDate: form.data.dateRange.start,
				endDate: form.data.dateRange.end
			})
			.returning();

		if (billingPeriod === undefined) {
			return fail(500, { form, message: 'Failed to insert billing period to database' });
		}

		// TODO: wrap this in a transaction
		try {
			await calculateAndStoreBills(form.data, billingPeriod.id, building.id);
		} catch (error) {
			console.error(error);
			await db.delete(billingPeriods).where(eq(billingPeriods.id, billingPeriod.id));
			return fail(500, { form });
		}

		console.groupEnd();

		return redirect(302, `/bills/${billingPeriod.id}`);
	}
};

async function calculateAndStoreBills(
	formData: FormSchema,
	billingPeriodId: ID,
	buildingId: ID
): Promise<void> {
	const electricity = calculateBills({
		billingPeriodId,
		buildingId,
		energyType: 'electricity',
		totalConsumption: formData.electricityTotalConsumption,
		totalCost: formData.electricityTotalCost,
		dateRange: formData.dateRange,
		occupants: formData.occupants
	});
	assert(electricity.success, 'Failed to calculate electricity bills');

	const water = calculateBills({
		billingPeriodId,
		buildingId,
		energyType: 'water',
		totalConsumption: formData.electricityTotalConsumption,
		totalCost: formData.electricityTotalCost,
		dateRange: formData.dateRange,
		occupants: formData.occupants
	});
	assert(water.success, 'Failed to calculate water bills');

	const heating = calculateBills({
		billingPeriodId,
		buildingId,
		energyType: 'heating',
		fixedCost: formData.heatingTotalFixedCost,
		totalConsumption: formData.waterTotalConsumption,
		totalCost: formData.waterTotalCost,
		dateRange: formData.dateRange,
		occupants: formData.occupants
	});
	assert(heating.success, 'Failed to calculate heating bills');

	const bills: EnergyBillInsert[] = electricity.value.billsToInsert.concat(
		water.value.billsToInsert,
		heating.value.billsToInsert
	);

	const records: ConsumptionRecordInsert[] = electricity.value.consumptionRecordsToInsert.concat(
		water.value.consumptionRecordsToInsert,
		heating.value.consumptionRecordsToInsert
	);

	return db.transaction(async (tx) => {
		if (bills.length > 0) {
			await tx.insert(energyBills).values(bills);
		}
		if (records.length > 0) {
			await tx.insert(consumptionRecords).values(records);
		}
	});
}
