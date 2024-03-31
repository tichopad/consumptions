import { getElectricityCostForOccupant } from '$lib/bills/electricity';
import {
	insertMeasuringDeviceSchema,
	occupants,
	selectMeasuringDeviceSchema,
	selectOccupantSchema,
	type ConsumptionRecordInsert,
	consumptionRecords,
	energyBills,
	type EnergyBill,
	type EnergyBillInsert,
	billingPeriods,
	type BillingPeriod
} from '$lib/models/schema';
import { db } from '$lib/server/db/client';
import { fail, type Actions, type Load } from '@sveltejs/kit';
import BigNumber from 'bignumber.js';
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

		console.log(form);

		if (!form.valid) return fail(400, { form });

		console.log(JSON.stringify(form.data, null, 2));

		const [billingPeriod] = await db
			.insert(billingPeriods)
			.values({
				buildingId: form.data.occupants[0].buildingId, //FIXME: we need to get the building ID from a better source
				startDate: form.data.dateRange.start,
				endDate: form.data.dateRange.end
			})
			.returning();

		try {
			// FIXME: actual transaction?
			await calculateElectricityBills(form.data, billingPeriod);
			await calculateWaterBills(form.data, billingPeriod);
			await calculateHeatingBills(form.data, billingPeriod);
		} catch (error) {
			console.error(error);
			await db.delete(billingPeriods).where(eq(billingPeriods.id, billingPeriod.id));
			return fail(500, { form });
		}

		console.groupEnd();

		return { form };
	}
};

async function calculateElectricityBills(
	form: FormSchema,
	billingPeriod: BillingPeriod
): Promise<EnergyBill[]> {
	const unitCost = new BigNumber(form.electricityTotalCost).dividedBy(
		form.electricityTotalConsumption
	);

	// Get occupants with measuring devices
	const measuredOccupants = form.occupants.filter((occupant) => {
		return occupant.measuringDevices.some((device) => device.energyType === 'electricity');
	});
	// Persist their consumption records based on the usage of their measuring devices
	const measuredConsumptionsInserts = measuredOccupants.flatMap((occupant) => {
		return occupant.measuringDevices
			.filter((device) => device.energyType === 'electricity')
			.map((device): ConsumptionRecordInsert => {
				return {
					measuringDeviceId: device.id,
					startDate: form.dateRange.start,
					endDate: form.dateRange.end,
					energyType: device.energyType,
					consumption: device.consumption ?? 0
				};
			});
	});
	// Calculate the total cost of electricity for each measured occupant based on the actual usage
	const measuredBillsInserts = measuredOccupants.map((occupant): EnergyBillInsert => {
		const totalConsumption = occupant.measuringDevices
			.filter((device) => device.energyType === 'electricity')
			.reduce((acc, device) => new BigNumber(device.consumption ?? 0).plus(acc).toNumber(), 0);
		const cost = new BigNumber(totalConsumption).times(unitCost).toNumber();
		return {
			startDate: form.dateRange.start,
			endDate: form.dateRange.end,
			occupantId: occupant.id,
			energyType: 'electricity',
			totalCost: cost,
			billingPeriodId: billingPeriod.id
		};
	});

	const totalMeasuredCost = measuredBillsInserts.reduce((acc, bill) => acc + bill.totalCost, 0);

	// Get occupants that are charged based on the square meters of their area
	const unmeasuredOccupants = form.occupants.filter((occupant) => {
		return occupant.chargedUnmeasuredElectricity === true;
	});
	const totalUnmeasuredArea = unmeasuredOccupants.reduce(
		(acc, occupant) => acc.plus(occupant.squareMeters),
		new BigNumber(0)
	);
	const remainingCost = new BigNumber(form.electricityTotalCost).minus(totalMeasuredCost);
	const costPerSquareMeter = remainingCost.div(totalUnmeasuredArea).toNumber();

	// Calculate the total cost of electricity for each unmeasured occupant by multiplying the cost per square meter by the area
	const unmeasuredBillsInserts = unmeasuredOccupants.map((occupant): EnergyBillInsert => {
		const cost = new BigNumber(occupant.squareMeters).times(costPerSquareMeter).toNumber();
		return {
			startDate: form.dateRange.start,
			endDate: form.dateRange.end,
			occupantId: occupant.id,
			energyType: 'electricity',
			totalCost: cost,
			billingPeriodId: billingPeriod.id
		};
	});

	const totalUnmeasuredCost = unmeasuredBillsInserts.reduce(
		(acc, bill) => acc.plus(bill.totalCost),
		new BigNumber(0)
	);

	const billsToInsert = measuredBillsInserts.concat(unmeasuredBillsInserts).concat({
		startDate: form.dateRange.start,
		endDate: form.dateRange.end,
		buildingId: form.occupants[0].buildingId, //FIXME: we need to get the building ID from a better source
		energyType: 'electricity',
		totalCost: form.electricityTotalCost,
		billingPeriodId: billingPeriod.id
	});

	let bills: EnergyBill[] = [];

	if (measuredConsumptionsInserts.length === 0) {
		const [newBills] = await db.batch([
			// FIXME: make sure inserts' values are not empty, otherwise it will throw an error
			db.insert(energyBills).values(billsToInsert).returning()
		]);
		bills = newBills;
	} else {
		const [newBills] = await db.batch([
			db.insert(energyBills).values(billsToInsert).returning(),
			db.insert(consumptionRecords).values(measuredConsumptionsInserts).returning()
		]);
		bills = newBills;
	}

	console.log('Electricity', { totalMeasuredCost, totalUnmeasuredCost });

	return bills;
}

async function calculateWaterBills(
	form: FormSchema,
	billingPeriod: BillingPeriod
): Promise<EnergyBill[]> {
	const unitCost = new BigNumber(form.waterTotalCost).dividedBy(form.waterTotalConsumption);

	// Get occupants with measuring devices
	const measuredOccupants = form.occupants.filter((occupant) => {
		return occupant.measuringDevices.some((device) => device.energyType === 'water');
	});
	// Persist their consumption records based on the usage of their measuring devices
	const measuredConsumptionsInserts = measuredOccupants.flatMap((occupant) => {
		return occupant.measuringDevices
			.filter((device) => device.energyType === 'water')
			.map((device): ConsumptionRecordInsert => {
				return {
					measuringDeviceId: device.id,
					startDate: form.dateRange.start,
					endDate: form.dateRange.end,
					energyType: device.energyType,
					consumption: device.consumption ?? 0
				};
			});
	});
	// Calculate the total cost of water for each measured occupant based on the actual usage
	const measuredBillsInserts = measuredOccupants.map((occupant): EnergyBillInsert => {
		const totalConsumption = occupant.measuringDevices
			.filter((device) => device.energyType === 'water')
			.reduce((acc, device) => new BigNumber(device.consumption ?? 0).plus(acc).toNumber(), 0);
		const cost = new BigNumber(totalConsumption).times(unitCost).toNumber();
		return {
			startDate: form.dateRange.start,
			endDate: form.dateRange.end,
			occupantId: occupant.id,
			energyType: 'water',
			totalCost: cost,
			billingPeriodId: billingPeriod.id
		};
	});

	const totalMeasuredCost = measuredBillsInserts.reduce((acc, bill) => acc + bill.totalCost, 0);

	// Get occupants that are charged based on the square meters of their area
	const unmeasuredOccupants = form.occupants.filter((occupant) => {
		return occupant.chargedUnmeasuredWater === true;
	});
	const totalUnmeasuredArea = unmeasuredOccupants.reduce(
		(acc, occupant) => acc.plus(occupant.squareMeters),
		new BigNumber(0)
	);
	const remainingCost = new BigNumber(form.waterTotalCost).minus(totalMeasuredCost);
	const costPerSquareMeter = remainingCost.div(totalUnmeasuredArea).toNumber();

	// Calculate the total cost of water for each unmeasured occupant by multiplying the cost per square meter by the area
	const unmeasuredBillsInserts = unmeasuredOccupants.map((occupant): EnergyBillInsert => {
		const cost = new BigNumber(occupant.squareMeters).times(costPerSquareMeter).toNumber();
		return {
			startDate: form.dateRange.start,
			endDate: form.dateRange.end,
			occupantId: occupant.id,
			energyType: 'water',
			totalCost: cost,
			billingPeriodId: billingPeriod.id
		};
	});

	const totalUnmeasuredCost = unmeasuredBillsInserts.reduce(
		(acc, bill) => acc.plus(bill.totalCost),
		new BigNumber(0)
	);

	const billsToInsert = measuredBillsInserts.concat(unmeasuredBillsInserts).concat({
		startDate: form.dateRange.start,
		endDate: form.dateRange.end,
		buildingId: form.occupants[0].buildingId, //FIXME: we need to get the building ID from a better source
		energyType: 'water',
		totalCost: form.waterTotalCost,
		billingPeriodId: billingPeriod.id
	});

	let bills: EnergyBill[] = [];

	if (measuredConsumptionsInserts.length === 0) {
		const [newBills] = await db.batch([
			// FIXME: make sure inserts' values are not empty, otherwise it will throw an error
			db.insert(energyBills).values(billsToInsert).returning()
		]);
		bills = newBills;
	} else {
		const [newBills] = await db.batch([
			db.insert(energyBills).values(billsToInsert).returning(),
			db.insert(consumptionRecords).values(measuredConsumptionsInserts).returning()
		]);
		bills = newBills;
	}

	console.log('Water', { totalMeasuredCost, totalUnmeasuredCost });

	return bills;
}

async function calculateHeatingBills(
	form: FormSchema,
	billingPeriod: BillingPeriod
): Promise<EnergyBill[]> {
	const unitCost = new BigNumber(form.heatingTotalCost).dividedBy(form.heatingTotalConsumption);

	// Get occupants with measuring devices
	const measuredOccupants = form.occupants.filter((occupant) =>
		occupant.measuringDevices.some((device) => device.energyType === 'heating')
	);
	// Persist their consumption records based on the usage of their measuring devices
	const measuredConsumptionsInserts = measuredOccupants.flatMap((occupant) =>
		occupant.measuringDevices
			.filter((device) => device.energyType === 'heating')
			.map(
				(device): ConsumptionRecordInsert => ({
					measuringDeviceId: device.id,
					startDate: form.dateRange.start,
					endDate: form.dateRange.end,
					energyType: device.energyType,
					consumption: device.consumption ?? 0
				})
			)
	);
	// Calculate the total cost of heating for each measured occupant based on the actual usage
	const measuredBillsInserts = measuredOccupants.map((occupant): EnergyBillInsert => {
		const measuredCost = occupant.measuringDevices
			.filter((device) => device.energyType === 'heating')
			.reduce((acc, device) => new BigNumber(device.consumption ?? 0).plus(acc), new BigNumber(0))
			.multipliedBy(unitCost);
		const totalFixedCost = new BigNumber(form.heatingTotalFixedCost ?? 0);
		const unitFixedCost = totalFixedCost.dividedBy(781);
		const fixedCost = unitFixedCost.multipliedBy(occupant.heatingFixedCostShare ?? 0).toNumber();
		const totalCost = measuredCost.plus(fixedCost).toNumber();
		return {
			startDate: form.dateRange.start,
			endDate: form.dateRange.end,
			occupantId: occupant.id,
			energyType: 'heating',
			totalCost,
			fixedCost,
			billingPeriodId: billingPeriod.id
		};
	});

	const totalMeasuredCost = measuredBillsInserts.reduce((acc, bill) => acc + bill.totalCost, 0);

	// Get occupants that are charged based on the square meters of their area
	const unmeasuredOccupants = form.occupants.filter((occupant) => {
		return occupant.chargedUnmeasuredHeating === true;
	});
	const totalUnmeasuredArea = unmeasuredOccupants.reduce(
		(acc, occupant) => acc.plus(occupant.squareMeters),
		new BigNumber(0)
	);
	const remainingCost = new BigNumber(form.heatingTotalCost).minus(totalMeasuredCost);
	const costPerSquareMeter = remainingCost.div(totalUnmeasuredArea).toNumber();

	// Calculate the total cost of heating for each unmeasured occupant by multiplying the cost per square meter by the area
	const unmeasuredBillsInserts = unmeasuredOccupants.map((occupant): EnergyBillInsert => {
		const unmeasuredCost = new BigNumber(occupant.squareMeters).times(costPerSquareMeter);
		const totalFixedCost = new BigNumber(form.heatingTotalFixedCost ?? 0);
		const unitFixedCost = totalFixedCost.dividedBy(781);
		// FIXME: should occupants with measuring devices that are charged for fixed share and by area be charged fixed share twice?
		const fixedCost = unitFixedCost.multipliedBy(occupant.heatingFixedCostShare ?? 0).toNumber();
		const totalCost = unmeasuredCost.plus(fixedCost).toNumber();
		return {
			startDate: form.dateRange.start,
			endDate: form.dateRange.end,
			occupantId: occupant.id,
			energyType: 'heating',
			totalCost,
			fixedCost,
			billingPeriodId: billingPeriod.id
		};
	});

	const totalUnmeasuredCost = unmeasuredBillsInserts.reduce(
		(acc, bill) => acc.plus(bill.totalCost),
		new BigNumber(0)
	);

	const billsToInsert = measuredBillsInserts.concat(unmeasuredBillsInserts).concat({
		startDate: form.dateRange.start,
		endDate: form.dateRange.end,
		buildingId: form.occupants[0].buildingId, //FIXME: we need to get the building ID from a better source
		energyType: 'heating',
		totalCost: form.heatingTotalCost,
		fixedCost: form.heatingTotalFixedCost,
		billingPeriodId: billingPeriod.id
	});

	let bills: EnergyBill[] = [];

	if (measuredConsumptionsInserts.length === 0) {
		const [newBills] = await db.batch([
			// FIXME: make sure inserts' values are not empty, otherwise it will throw an error
			db.insert(energyBills).values(billsToInsert).returning()
		]);
		bills = newBills;
	} else {
		const [newBills] = await db.batch([
			db.insert(energyBills).values(billsToInsert).returning(),
			db.insert(consumptionRecords).values(measuredConsumptionsInserts).returning()
		]);
		bills = newBills;
	}

	console.log('Heating', { totalMeasuredCost, totalUnmeasuredCost });

	return bills;
}
