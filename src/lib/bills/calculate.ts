import type { EnergyType } from '$lib/models/common';
import type { ConsumptionRecordInsert } from '$lib/models/consumption-record';
import type { EnergyBillInsert } from '$lib/models/energy-bill';
import { err, ok, type Result } from '$lib/result';
import { capitalize, sumPreciseBy } from '$lib/utils';
import BigNumber from 'bignumber.js';
import type {
	CalculationInput,
	CalculationOutput,
	OccupantCalculationEntry
} from './calculation-types';

// -- Errors --

export class CalculationInputError extends Error {
	message = 'Calculation failed because of an invalid input';
}

/**
 * Calculates bills for a given period, energy type and occupants.
 * Returns database inputs.
 */
export function calculateBills(
	input: CalculationInput
): Result<CalculationOutput, CalculationInputError> {
	if (input.occupants.length === 0) {
		return err(new CalculationInputError('No occupants given'));
	}
	if (input.totalConsumption <= 0) {
		return err(new CalculationInputError('Total consumption cannot be negative or zero'));
	}
	if (input.totalCost <= 0) {
		return err(new CalculationInputError('Total cost cannot be negative or zero'));
	}

	// Basic values for the entire bill
	const totalConsumption = new BigNumber(input.totalConsumption);
	const totalCost = new BigNumber(input.totalCost);
	const costPerUnit = totalCost.dividedBy(totalConsumption);

	// Process occupants with measuring devices
	const occupantsMeasured = input.occupants.filter((o) => hasDevices(input.energyType, o));

	const consumptionsRecords: ConsumptionRecordInsert[] = getConsumptionRecords(
		occupantsMeasured,
		input
	);
	const billsMeasured: EnergyBillInsert[] = getMeasuredBills(occupantsMeasured, costPerUnit, input);

	// Start processing occupants charged based on area
	const occupantsUnmeasured = input.occupants.filter((o) => isChargedByArea(input.energyType, o));

	// Calculate variables for splitting the remaining unmeasured cost
	const totalCostForMeasuredConsumption = sumPreciseBy(billsMeasured, (b) => b.measuredCost ?? 0);
	const totalAreaOfUnmeasuredOccupants = sumPreciseBy(occupantsUnmeasured, (o) => o.squareMeters);
	const remainingCostToSplit = totalCost.minus(totalCostForMeasuredConsumption);

	// Avoid division by zero if there's no unmeasured area ...
	// I could skip the calculation here, but if there's an occupant with
	// area = 0, I might want to support it
	const costPerSquareMeter = totalAreaOfUnmeasuredOccupants.isEqualTo(0)
		? new BigNumber(0)
		: remainingCostToSplit.dividedBy(totalAreaOfUnmeasuredOccupants);

	const billsUnmeasured: EnergyBillInsert[] = getUnmeasuredBills(
		occupantsUnmeasured,
		costPerSquareMeter,
		input
	);

	// Finally, there needs to be a summary bill for the entire building
	const billForBuilding: EnergyBillInsert = {
		billingPeriodId: input.billingPeriodId,
		buildingId: input.buildingId,
		costPerSquareMeter: costPerSquareMeter.toNumber(),
		costPerUnit: costPerUnit.toNumber(),
		startDate: input.dateRange.start,
		endDate: input.dateRange.end,
		energyType: input.energyType,
		totalConsumption: totalConsumption.toNumber(),
		totalCost: totalCost.toNumber()
	};

	const output: CalculationOutput = {
		billsToInsert: billsMeasured.concat(billsUnmeasured, billForBuilding),
		consumptionRecordsToInsert: consumptionsRecords
	};

	return ok(output);
}

// -- Helpers --

// Maps occupants' measured consumption to their EnergyBill insert values
function getMeasuredBills(
	measuredOccupants: OccupantCalculationEntry[],
	costPerUnit: BigNumber,
	input: CalculationInput
): EnergyBillInsert[] {
	return measuredOccupants.map((occupant) => {
		const totalConsumption = sumMeasuredConsumption(input.energyType, occupant);
		const measuredCost = totalConsumption.times(costPerUnit).toNumber();
		return {
			billingPeriodId: input.billingPeriodId,
			startDate: input.dateRange.start,
			endDate: input.dateRange.end,
			energyType: input.energyType,
			totalCost: measuredCost,
			costPerUnit: costPerUnit.toNumber(),
			totalConsumption: totalConsumption.toNumber(),
			occupantId: occupant.id,
			measuredCost
		};
	});
}

// Sum consumption of all occupant's devices
function sumMeasuredConsumption(
	energyType: EnergyType,
	occupant: OccupantCalculationEntry
): BigNumber {
	const devices = getDevices(energyType, occupant);
	const totalMeasuredConsumption = sumPreciseBy(devices, (d) => d.consumption ?? 0);

	return totalMeasuredConsumption;
}

// Maps occupants' unmeasured consumption (based on area) to their EnergyBill insert values
function getUnmeasuredBills(
	occupantsUnmeasured: OccupantCalculationEntry[],
	costPerSquareMeter: BigNumber,
	input: CalculationInput
): EnergyBillInsert[] {
	return occupantsUnmeasured.map((occupant) => ({
		billingPeriodId: input.billingPeriodId,
		billedArea: occupant.squareMeters,
		costPerSquareMeter: costPerSquareMeter.toNumber(),
		startDate: input.dateRange.start,
		endDate: input.dateRange.end,
		energyType: input.energyType,
		occupantId: occupant.id,
		totalCost: costPerSquareMeter.times(occupant.squareMeters).toNumber()
	}));
}

// Maps occupants' device consumption entries to ConsumptionRecord insert values
function getConsumptionRecords(
	measuredOccupants: OccupantCalculationEntry[],
	input: CalculationInput
): ConsumptionRecordInsert[] {
	const devices = measuredOccupants.flatMap((o) => getDevices(input.energyType, o));

	return devices.map((device) => ({
		consumption: device.consumption ?? 0,
		startDate: input.dateRange.start,
		endDate: input.dateRange.end,
		energyType: input.energyType,
		measuringDeviceId: device.id
	}));
}

// Get device consumptions
function getDevices(energyType: EnergyType, occupant: OccupantCalculationEntry) {
	return occupant.measuringDevices.filter((device) => device.energyType === energyType);
}

// Check if occupant has device consumptions for a given energy type
function hasDevices(energyType: EnergyType, occupant: OccupantCalculationEntry): boolean {
	return occupant.measuringDevices.some((device) => device.energyType === energyType);
}

// Checks whether an occupant is charged for an energy type based on their area
function isChargedByArea(energyType: EnergyType, occupant: OccupantCalculationEntry): boolean {
	const unmeasuredChargeProperty = `chargedUnmeasured${capitalize(energyType)}` as const;

	return occupant[unmeasuredChargeProperty] === true;
}
