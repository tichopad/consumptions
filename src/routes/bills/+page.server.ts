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
	type EnergyBillInsert
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

		await calculateElectricityBills(form.data);

		return { form };
	}
};

async function calculateElectricityBills(form: FormSchema): Promise<EnergyBill[]> {
	// -- Measured --

	const measuredOccupants = form.occupants.filter((occupant) => {
		return occupant.chargedUnmeasuredElectricity === false;
	});
	const measuredConsumptionsInserts = measuredOccupants.flatMap((occupant) => {
		return occupant.measuringDevices
			.filter((device) => device.energyType === 'electricity')
			.map((device): ConsumptionRecordInsert => {
				return {
					measuringDeviceId: device.id,
					startDate: form.startDate,
					endDate: form.endDate,
					consumption: device.consumption ?? 0 // FIXME: Consumption should be required in the form
				};
			});
	});

	const measuredBillsInserts = measuredOccupants.map((occupant): EnergyBillInsert => {
		const totalConsumption = occupant.measuringDevices.reduce(
			(acc, device) => (device.consumption ?? 0) + acc,
			0
		);
		const cost = getElectricityCostForOccupant(
			occupant,
			totalConsumption,
			form.electricityUnitCost
		);
		return {
			startDate: form.startDate,
			endDate: form.endDate,
			occupantId: occupant.id,
			energyType: 'electricity',
			totalCost: cost
		};
	});

	const totalMeasuredCost = measuredBillsInserts.reduce((acc, bill) => acc + bill.totalCost, 0);

	// -- Unmeasured --

	const unmeasuredOccupants = form.occupants.filter((occupant) => {
		return occupant.chargedUnmeasuredElectricity === true;
	});
	const totalUnmeasuredArea = unmeasuredOccupants.reduce(
		(acc, occupant) => acc + occupant.squareMeters,
		0
	);
	const remainingCost = form.electricityTotalCost - totalMeasuredCost;
	const costPerSquareMeter = remainingCost / totalUnmeasuredArea;
	const unmeasuredBillsInserts = unmeasuredOccupants.map((occupant): EnergyBillInsert => {
		const cost = getElectricityCostForOccupant(
			occupant,
			null,
			form.electricityUnitCost,
			costPerSquareMeter
		);
		return {
			startDate: form.startDate,
			endDate: form.endDate,
			occupantId: occupant.id,
			energyType: 'electricity',
			totalCost: cost
		};
	});

	const totalUnmeasuredCost = unmeasuredBillsInserts.reduce((acc, bill) => acc + bill.totalCost, 0);

	// -- Execute --

	const bills: EnergyBill[] = [];

	if (measuredConsumptionsInserts.length === 0) {
		const [measuredBills, unmeasuredBills] = await db.batch([
			db.insert(energyBills).values(measuredBillsInserts).returning(),
			db.insert(energyBills).values(unmeasuredBillsInserts).returning()
		]);
		bills.push(...measuredBills, ...unmeasuredBills);
	} else {
		const [, measuredBills, unmeasuredBills] = await db.batch([
			db.insert(consumptionRecords).values(measuredConsumptionsInserts).returning(),
			db.insert(energyBills).values(measuredBillsInserts).returning(),
			db.insert(energyBills).values(unmeasuredBillsInserts).returning()
		]);
		bills.push(...measuredBills, ...unmeasuredBills);
	}

	console.log({ totalMeasuredCost, totalUnmeasuredCost });

	return bills;
}
