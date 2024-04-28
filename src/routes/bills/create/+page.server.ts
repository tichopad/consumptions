import {
	billingPeriods,
	consumptionRecords,
	energyBills,
	insertMeasuringDeviceSchema,
	occupants,
	selectMeasuringDeviceSchema,
	selectOccupantSchema,
	type BillingPeriod,
	type ConsumptionRecordInsert,
	type EnergyBill,
	type EnergyBillInsert,
	type ID
} from '$lib/models/schema';
import { db } from '$lib/server/db/client';
import { fail, redirect, type Actions, type Load } from '@sveltejs/kit';
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

		try {
			// FIXME: actual transaction?
			await calculateElectricityBills(form.data, billingPeriod, building.id);
			await calculateWaterBills(form.data, billingPeriod, building.id);
			await calculateHeatingBills(form.data, billingPeriod, building.id);
		} catch (error) {
			console.error(error);
			await db.delete(billingPeriods).where(eq(billingPeriods.id, billingPeriod.id));
			return fail(500, { form });
		}

		console.groupEnd();

		return redirect(302, `/bills/${billingPeriod.id}`);
	}
};

async function calculateElectricityBills(
	form: FormSchema,
	billingPeriod: BillingPeriod,
	buildingId: ID
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
			billingPeriodId: billingPeriod.id,
			costPerUnit: unitCost.toNumber(),
			endDate: form.dateRange.end,
			energyType: 'electricity',
			occupantId: occupant.id,
			startDate: form.dateRange.start,
			totalConsumption,
			totalCost: cost
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
			billingPeriodId: billingPeriod.id,
			billedArea: occupant.squareMeters,
			costPerSquareMeter,
			endDate: form.dateRange.end,
			energyType: 'electricity',
			occupantId: occupant.id,
			startDate: form.dateRange.start,
			totalCost: cost
		};
	});

	// const totalUnmeasuredCost = unmeasuredBillsInserts.reduce(
	// 	(acc, bill) => acc.plus(bill.totalCost),
	// 	new BigNumber(0)
	// );

	const buildingBill: EnergyBillInsert = {
		billingPeriodId: billingPeriod.id,
		buildingId,
		costPerSquareMeter,
		costPerUnit: unitCost.toNumber(),
		endDate: form.dateRange.end,
		energyType: 'electricity',
		startDate: form.dateRange.start,
		totalConsumption: form.electricityTotalConsumption,
		totalCost: form.electricityTotalCost
	};
	const billsToInsert = measuredBillsInserts.concat(unmeasuredBillsInserts).concat(buildingBill);

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

	return bills;
}

async function calculateWaterBills(
	form: FormSchema,
	billingPeriod: BillingPeriod,
	buildingId: ID
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
			billingPeriodId: billingPeriod.id,
			costPerUnit: unitCost.toNumber(),
			endDate: form.dateRange.end,
			energyType: 'water',
			occupantId: occupant.id,
			startDate: form.dateRange.start,
			totalConsumption,
			totalCost: cost
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
			billingPeriodId: billingPeriod.id,
			billedArea: occupant.squareMeters,
			costPerSquareMeter,
			endDate: form.dateRange.end,
			energyType: 'water',
			occupantId: occupant.id,
			startDate: form.dateRange.start,
			totalCost: cost
		};
	});

	// const totalUnmeasuredCost = unmeasuredBillsInserts.reduce(
	// 	(acc, bill) => acc.plus(bill.totalCost),
	// 	new BigNumber(0)
	// );

	const buildingBill: EnergyBillInsert = {
		billingPeriodId: billingPeriod.id,
		buildingId,
		costPerSquareMeter,
		costPerUnit: unitCost.toNumber(),
		endDate: form.dateRange.end,
		energyType: 'water',
		startDate: form.dateRange.start,
		totalConsumption: form.waterTotalConsumption,
		totalCost: form.waterTotalCost
	};
	const billsToInsert = measuredBillsInserts.concat(unmeasuredBillsInserts).concat(buildingBill);

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

	return bills;
}

async function calculateHeatingBills(
	form: FormSchema,
	billingPeriod: BillingPeriod,
	buildingId: ID
): Promise<EnergyBill[]> {
	const unitCost = new BigNumber(form.heatingTotalCost).dividedBy(form.heatingTotalConsumption);

	// Get occupants with measuring devices
	const measuredOccupants = form.occupants.filter((occupant) =>
		occupant.measuringDevices.some((device) => device.energyType === 'heating')
	);

	console.log(
		'-- Measured occupants --',
		measuredOccupants.map((o) => o.name)
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

	console.log(
		'-- Measured consumptions --',
		measuredConsumptionsInserts.map((c) => c.consumption)
	);

	const sumOfAllFixedHeatingShares = form.occupants.reduce(
		(acc, o) => acc.plus(o.heatingFixedCostShare ?? 0),
		new BigNumber(0)
	);
	const totalFixedCost = new BigNumber(form.heatingTotalFixedCost ?? 0);
	const unitFixedCost = totalFixedCost.dividedBy(sumOfAllFixedHeatingShares);

	console.group('--- Measured bills inserts ---');
	// Calculate the total cost of heating for each measured occupant based on the actual usage
	const measuredBillsInserts = measuredOccupants.map((occupant): EnergyBillInsert => {
		console.log('Occupant', occupant);
		const totalConsumption = occupant.measuringDevices
			.filter((device) => device.energyType === 'heating')
			.reduce((acc, device) => new BigNumber(device.consumption ?? 0).plus(acc), new BigNumber(0));

		console.log('Total consumption', totalConsumption);

		// TODO: maybe i need to materialize measured cost and use the sum of it below to calculate unmeasured bills
		// because using totalCost includes the fixed cost as well, which is not what we want
		const measuredCost = totalConsumption.multipliedBy(unitCost);

		console.log('Cost of measured consumption', measuredCost);

		console.log('Total fixed cost for all', totalFixedCost);

		console.log('Total unit cost for fixed share', unitFixedCost);

		const fixedCost = unitFixedCost.multipliedBy(occupant.heatingFixedCostShare ?? 0).toNumber();

		console.log('Fixed cost', fixedCost);

		const totalCost = measuredCost.plus(fixedCost).toNumber();

		console.log('Total cost', totalCost);

		return {
			billingPeriodId: billingPeriod.id,
			costPerUnit: unitCost.toNumber(),
			endDate: form.dateRange.end,
			energyType: 'heating',
			fixedCost,
			measuredCost: measuredCost.toNumber(),
			occupantId: occupant.id,
			startDate: form.dateRange.start,
			totalConsumption: totalConsumption.toNumber(),
			totalCost
		};
	});
	console.groupEnd();

	const totalMeasuredCost = measuredBillsInserts.reduce(
		(acc, bill) => acc + (bill.measuredCost ?? 0),
		0
	);

	console.log('-- Total measured cost --', totalMeasuredCost);

	// Get occupants that are charged based on the square meters of their area
	const unmeasuredOccupants = form.occupants.filter((occupant) => {
		return occupant.chargedUnmeasuredHeating === true;
	});

	console.log(
		'-- Unmeasured occupants --',
		unmeasuredOccupants.map((o) => o.name)
	);

	const totalUnmeasuredArea = unmeasuredOccupants.reduce(
		(acc, occupant) => acc.plus(occupant.squareMeters),
		new BigNumber(0)
	);

	console.log('-- Unmeasured area --', totalUnmeasuredArea);

	console.log('-- Form total fixed cost --', form.heatingTotalFixedCost);

	const remainingCost = new BigNumber(form.heatingTotalCost)
		.minus(totalMeasuredCost)
		.minus(form.heatingTotalFixedCost ?? 0);

	console.log('-- Remaining cost --', remainingCost);

	const costPerSquareMeter = remainingCost.div(totalUnmeasuredArea).toNumber();

	console.log('-- Cost per m2 --', costPerSquareMeter);

	console.group('-- Unmeasured bills inserts -- ');

	// Calculate the total cost of heating for each unmeasured occupant by multiplying the cost per square meter by the area
	const unmeasuredBillsInserts = unmeasuredOccupants.map((occupant): EnergyBillInsert => {
		const unmeasuredCost = new BigNumber(occupant.squareMeters).times(costPerSquareMeter);

		console.log('Unmeasured cost', unmeasuredCost);

		console.log('Total fixed cost for all', totalFixedCost);

		console.log('Total unit cost for fixed share', unitFixedCost);

		// FIXME: should occupants with measuring devices that are charged for fixed share and by area be charged fixed share twice?
		// I think there should be a rule preventing unmeasured occupants from partaking in the fixed cost share
		// TODO: Ask Ivan?
		const fixedCost = unitFixedCost.multipliedBy(occupant.heatingFixedCostShare ?? 0).toNumber();

		console.log('Fixed cost', fixedCost);

		const totalCost = unmeasuredCost.plus(fixedCost).toNumber();

		console.log('Total cost', totalCost);

		return {
			billingPeriodId: billingPeriod.id,
			billedArea: occupant.squareMeters,
			costPerSquareMeter,
			endDate: form.dateRange.end,
			energyType: 'heating',
			fixedCost,
			occupantId: occupant.id,
			startDate: form.dateRange.start,
			totalCost
		};
	});

	console.groupEnd();

	const totalUnmeasuredCost = unmeasuredBillsInserts.reduce(
		(acc, bill) => acc.plus(bill.totalCost),
		new BigNumber(0)
	);

	console.log('-- Total unmeasured cost --', totalUnmeasuredCost);

	const buildingBill: EnergyBillInsert = {
		billingPeriodId: billingPeriod.id,
		buildingId,
		costPerSquareMeter,
		costPerUnit: unitCost.toNumber(),
		endDate: form.dateRange.end,
		energyType: 'heating',
		fixedCost: form.heatingTotalFixedCost,
		startDate: form.dateRange.start,
		totalConsumption: form.heatingTotalConsumption,
		totalCost: form.heatingTotalCost
	};
	const billsToInsert = measuredBillsInserts.concat(unmeasuredBillsInserts).concat(buildingBill);

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

	return bills;
}
