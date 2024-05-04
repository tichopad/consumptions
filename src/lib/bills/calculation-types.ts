import type { DateRange } from '$lib/common-types';
import type { ID, EnergyType } from '$lib/models/common';
import type { ConsumptionRecordInsert } from '$lib/models/consumption-record';
import type { EnergyBillInsert } from '$lib/models/energy-bill';
import type { Occupant } from '$lib/models/occupant';

/** Defines ID of a measuring device and the consumption it measured */
export type MeasuringDeviceConsumption = {
	id: ID;
	energyType: EnergyType;
	consumption?: number;
};

/** Defines basic occupant information and their measured consumptions */
export type OccupantCalculationEntry = Pick<
	Occupant,
	| 'id'
	| 'chargedUnmeasuredElectricity'
	| 'chargedUnmeasuredHeating'
	| 'chargedUnmeasuredWater'
	| 'squareMeters'
> & {
	measuringDevices: MeasuringDeviceConsumption[];
};

/** Input for the calculation (duh) */
export type CalculationInput = {
	/** ID of the parent Billing Period */
	billingPeriodId: ID;
	/** ID if the building this calculation falls under */
	buildingId: ID;
	/** Type of the energy relevant for this calculation */
	energyType: EnergyType;
	/** Total consumption of the energy type in a given period */
	totalConsumption: number;
	/** Total cost of the consumption */
	totalCost: number;
	/** The time period */
	dateRange: DateRange;
	/** Occupants participating; passing in an empty array will result in an error! */
	occupants: OccupantCalculationEntry[];
};

/** Output from the calculation (kek) */
export type CalculationOutput = {
	/** Energy bills to insert (database insertion values) */
	billsToInsert: EnergyBillInsert[];
	/** Consumption records to insert (database insertion values) */
	consumptionRecordsToInsert: ConsumptionRecordInsert[];
};
