import type { ConsumptionRecordInsert } from '$lib/models/consumption-record';
import type { EnergyBillInsert } from '$lib/models/energy-bill';
import { isChargedForUnmeasuredEnergy } from '$lib/occupants/utils';
import { err, ok, type Result } from '$lib/result';
import { isNullable, sumPreciseBy } from '$lib/utils';
import BigNumber from 'bignumber.js';
import type { CalculationInput, CalculationOutput } from './calculation-types';
import {
	getBillsForOwnersWithoutMeasurements,
	getConsumptionRecords,
	getMeasuredBills,
	getUnmeasuredBills,
	hasDevices
} from './utils';

/** Describes incorrect input or errors related to the input */
export class CalculationInputError extends Error {}

/** Describes a negative cost or calculated value */
export class UnexpectedNegativeCalculationError extends Error {}

// All possible expected errors
type CalculationError = CalculationInputError | UnexpectedNegativeCalculationError;

/**
 * Calculates bills for a given period, energy type and occupants.
 * Returns database inputs.
 *
 * The calculation should work in the following way:
 *
 * 1. Take all the occupants that have a consumption measuring device
 * 2. Bill each of these for their actual consumption
 * 3. Sum up all the measured consumption cost and subtract it from the total cost
 * 4. Now take all occupants that are charged based on area (renters typically)
 * 5. Sum up all the area they're using and split the remaining cost proportionally
 *
 * Note that an occupant charged based on their area can also have an extra measuring device.
 * That occupant would be charged for both separately - the actual consumption as well as the area
 * they're occupying.
 */
export function calculateBills(
	input: CalculationInput
): Result<CalculationOutput, CalculationError> {
	if (input.occupants.length === 0) {
		return err(new CalculationInputError('No occupants given'));
	}
	if (input.totalConsumption < 0) {
		return err(
			new CalculationInputError('Total consumption cannot be negative', {
				cause: new Error(`Expected a positive number, got ${input.totalConsumption}`)
			})
		);
	}
	if (input.totalCost <= 0) {
		return err(
			new CalculationInputError('Total cost cannot be negative', {
				cause: new Error(`Expected a positive number, got ${input.totalCost}`)
			})
		);
	}
	if (input.fixedCost !== undefined && input.fixedCost < 0) {
		return err(
			new CalculationInputError('Fixed cost cannot be negative', {
				cause: new Error(`Expected a positive number, got ${input.fixedCost}`)
			})
		);
	}
	if (input.fixedCost !== undefined && input.energyType !== 'heating') {
		return err(
			new CalculationInputError('Only "heating" can have a fixed cost', {
				cause: new Error(`Expected "heating", got "${input.energyType}"`)
			})
		);
	}

	// Basic values for the entire bill
	const totalConsumption = new BigNumber(input.totalConsumption);
	const totalCost = new BigNumber(input.totalCost);
	const fixedCost = input.fixedCost !== undefined ? new BigNumber(input.fixedCost) : null;
	const variableCost = fixedCost !== null ? totalCost.minus(fixedCost) : totalCost;
	const costPerUnit = totalConsumption.isEqualTo(0)
		? new BigNumber(0)
		: variableCost.dividedBy(totalConsumption);

	// Additional basic values for splitting up the fixed cost
	const sumOfFixedHeatingShares = sumPreciseBy(
		input.occupants,
		(o) => o.heatingFixedCostShare ?? 0
	);
	let costPerFixedHeatingShare: BigNumber | null = null;

	// If there's no fixed cost, there's no need to calculate the share
	if (fixedCost !== null) {
		if (sumOfFixedHeatingShares.isEqualTo(0)) {
			costPerFixedHeatingShare = null;
		} else {
			costPerFixedHeatingShare = fixedCost.dividedBy(sumOfFixedHeatingShares);
		}
	}

	// If the cost per fixed heating share is negative, return an error
	if (costPerFixedHeatingShare !== null && costPerFixedHeatingShare.isNegative()) {
		return err(
			new UnexpectedNegativeCalculationError(
				'Cost per fixed heating share turned out to be negative'
			)
		);
	}

	// Process occupants with measuring devices
	const occupantsMeasured = input.occupants.filter((o) => hasDevices(input.energyType, o));

	const consumptionsRecords: ConsumptionRecordInsert[] = getConsumptionRecords(
		occupantsMeasured,
		input
	);
	const billsMeasured: EnergyBillInsert[] = getMeasuredBills(
		occupantsMeasured,
		costPerUnit,
		costPerFixedHeatingShare,
		input
	);

	// Start processing occupants charged based on area
	const occupantsUnmeasured = input.occupants.filter((o) =>
		isChargedForUnmeasuredEnergy(input.energyType, o)
	);

	// Calculate variables for splitting the remaining unmeasured cost
	const totalCostForMeasuredConsumption = sumPreciseBy(billsMeasured, (b) => b.measuredCost ?? 0);
	const totalAreaOfUnmeasuredOccupants = sumPreciseBy(occupantsUnmeasured, (o) => o.squareMeters);

	// If there's a fixed part to the cost, it's only covered by occupants with measured consumption
	const remainingCostToSplit = variableCost.minus(totalCostForMeasuredConsumption);

	// If the remaining cost to split is negative, return an error
	if (remainingCostToSplit.isNegative()) {
		return err(
			new UnexpectedNegativeCalculationError('Remaining cost to split turned out to be negative')
		);
	}

	// Avoid division by zero if there's no unmeasured area ...
	// I could skip the calculation here, but if there's an occupant with
	// area = 0, I might want to support it
	const costPerSquareMeter = totalAreaOfUnmeasuredOccupants.isEqualTo(0)
		? new BigNumber(0)
		: remainingCostToSplit.dividedBy(totalAreaOfUnmeasuredOccupants);

	// If the cost per square meter is negative, return an error
	if (costPerSquareMeter.isNegative()) {
		return err(
			new UnexpectedNegativeCalculationError('Cost per square meter turned out to be negative')
		);
	}

	const billsUnmeasured: EnergyBillInsert[] = getUnmeasuredBills(
		occupantsUnmeasured,
		costPerSquareMeter,
		input
	);

	// Lastly, if there're occupants with fixed heating cost share, but no measurements/devices and
	// no unmeasured energy, there needs to be at least a fixed cost bill for them
	// This is a legit case, e.g. for the owner of the building
	const ownersWithoutConsumption = input.occupants.filter((o) => {
		return (
			!isNullable(o.heatingFixedCostShare) &&
			!hasDevices(input.energyType, o) &&
			!isChargedForUnmeasuredEnergy(input.energyType, o)
		);
	});
	const fixedCostOnlyBills: EnergyBillInsert[] = getBillsForOwnersWithoutMeasurements(
		ownersWithoutConsumption,
		costPerFixedHeatingShare,
		input
	);

	// Finally, there needs to be a summary bill for the entire building
	const billForBuilding: EnergyBillInsert = {
		billingPeriodId: input.billingPeriodId,
		buildingId: input.buildingId,
		costPerSquareMeter: costPerSquareMeter.toNumber(),
		costPerUnit: costPerUnit.toNumber(),
		fixedCost: fixedCost !== null ? fixedCost.toNumber() : undefined,
		startDate: input.dateRange.start,
		endDate: input.dateRange.end,
		energyType: input.energyType,
		totalConsumption: totalConsumption.toNumber(),
		totalCost: totalCost.toNumber()
	};

	const output: CalculationOutput = {
		billsToInsert: billsMeasured.concat(billsUnmeasured, billForBuilding, fixedCostOnlyBills),
		consumptionRecordsToInsert: consumptionsRecords
	};

	return ok(output);
}
