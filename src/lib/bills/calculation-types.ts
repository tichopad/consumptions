import type { DateRange } from '$lib/common-types';
import type { EnergyType, ID } from '$lib/models/common';
import type { ConsumptionRecordInsert } from '$lib/models/consumption-record';
import type { EnergyBillInsert } from '$lib/models/energy-bill';
import type { Occupant } from '$lib/models/occupant';

/** Basic consumption information required for the calculation */
export type MeasuringDeviceConsumption = {
	id: ID;
	energyType: EnergyType;
	consumption?: number;
};

/** Basic occupant information required for the calculation */
export type OccupantCalculationEntry = Pick<
	Occupant,
	| 'id'
	| 'chargedUnmeasuredElectricity'
	| 'chargedUnmeasuredHeating'
	| 'chargedUnmeasuredWater'
	| 'heatingFixedCostShare'
	| 'squareMeters'
> & {
	measuringDevices: MeasuringDeviceConsumption[];
};

/** Input for the calculation. Everything that's required for the calculaction. */
export type CalculationInput = {
	/** ID of the parent Billing Period */
	billingPeriodId: ID;
	/** ID if the building this calculation falls under */
	buildingId: ID;
	/** Type of the energy relevant for this calculation */
	energyType: EnergyType;
	/** Fixed part of the total cost, that's charged no matter the consumption. Only some energy types have this, e.g., heating */
	fixedCost?: number;
	/** Total consumption of the energy type in a given period */
	totalConsumption: number;
	/** Total cost of the consumption */
	totalCost: number;
	/** The time period */
	dateRange: DateRange;
	/** Occupants participating; passing in an empty array will result in an error! */
	occupants: OccupantCalculationEntry[];
};

/** Output from the calculation. Database insertion values. */
export type CalculationOutput = {
	/** Energy bills to insert (database insertion values) */
	billsToInsert: EnergyBillInsert[];
	/** Consumption records to insert (database insertion values) */
	consumptionRecordsToInsert: ConsumptionRecordInsert[];
};
