import { calculateBills } from '$lib/bills/calculate';
import { logger } from '$lib/logger';
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
import { assertSuccess } from '$lib/utils';
import { fail, redirect, type Actions, type Load } from '@sveltejs/kit';
import { and, asc, eq } from 'drizzle-orm';
import { message, superValidate } from 'sveltekit-superforms';
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
	logger.info('Loading data for /bills/create');

	const occupantsList = await db.query.occupants.findMany({
		orderBy: asc(occupants.name),
		where: and(eq(occupants.isArchived, false), eq(occupants.isDeleted, false)),
		with: {
			measuringDevices: true
		}
	});

	logger.trace({ occupantsList }, 'Loaded the list of occupants');

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

	logger.trace({ defaultOccupants }, 'Prepared default occupants data for the bill creation form');
	logger.info('Returning loaded data');

	return {
		form: await superValidate({ occupants: defaultOccupants }, zod(formSchema)),
		occupants: occupantsList
	};
};

export const actions: Actions = {
	createBill: async (event) => {
		logger.info('Handling createBill action');

		const form = await superValidate(event, zod(formSchema));

		logger.debug({ form }, 'Form data validated');

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
			logger.error(error);
			await db.delete(billingPeriods).where(eq(billingPeriods.id, billingPeriod.id));
			return message(form, 'Nepodařilo se vytvořit vyúčtování.', { status: 500 });
		}

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
	assertSuccess(electricity, 'Failed to calculate electricity bills');

	const water = calculateBills({
		billingPeriodId,
		buildingId,
		energyType: 'water',
		totalConsumption: formData.waterTotalConsumption,
		totalCost: formData.waterTotalCost,
		dateRange: formData.dateRange,
		occupants: formData.occupants
	});
	assertSuccess(water, 'Failed to calculate water bills');

	const heating = calculateBills({
		billingPeriodId,
		buildingId,
		energyType: 'heating',
		fixedCost: formData.heatingTotalFixedCost,
		totalConsumption: formData.heatingTotalConsumption,
		totalCost: formData.heatingTotalCost,
		dateRange: formData.dateRange,
		occupants: formData.occupants
	});
	assertSuccess(heating, 'Failed to calculate heating bills');

	const bills: EnergyBillInsert[] = electricity.value.billsToInsert.concat(
		water.value.billsToInsert,
		heating.value.billsToInsert
	);

	const records: ConsumptionRecordInsert[] = electricity.value.consumptionRecordsToInsert.concat(
		water.value.consumptionRecordsToInsert,
		heating.value.consumptionRecordsToInsert
	);

	logger.debug({ bills, records }, 'Starting transaction');

	return db.transaction(async (tx) => {
		if (bills.length > 0) {
			logger.debug({ bills }, 'Inserting bills');
			await tx.insert(energyBills).values(bills);
		} else {
			logger.debug({ bills }, 'No bills to insert');
		}
		if (records.length > 0) {
			logger.debug({ records }, 'Inserting records');
			await tx.insert(consumptionRecords).values(records);
		} else {
			logger.debug({ records }, 'No records to insert');
		}
		logger.debug('Committing transaction');
	});
}
