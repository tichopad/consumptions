import type { EnergyType } from '$lib/models/common';
import type { ConsumptionRecordInsert } from '$lib/models/consumption-record';
import type { EnergyBillInsert } from '$lib/models/energy-bill';
import { capitalize, isNullable, sumPreciseBy } from '$lib/utils';
import type BigNumber from 'bignumber.js';
import type { CalculationInput, OccupantCalculationEntry } from './calculation-types';

/**
 * Maps occupants' measured consumption to their EnergyBill insert values
 */
export function getMeasuredBills(
	measuredOccupants: OccupantCalculationEntry[],
	costPerUnit: BigNumber,
	costPerFixedHeatingShare: BigNumber | null,
	input: CalculationInput
): EnergyBillInsert[] {
	return measuredOccupants.map((occupant) => {
		const totalConsumption = sumMeasuredConsumption(input.energyType, occupant);
		const measuredCost = totalConsumption.times(costPerUnit);

		let fixedCost: number | undefined;

		// Check if the occupant participates in the fixed heating cost
		if (!isNullable(occupant.heatingFixedCostShare) && !isNullable(costPerFixedHeatingShare)) {
			fixedCost = costPerFixedHeatingShare.multipliedBy(occupant.heatingFixedCostShare).toNumber();
		}

		return {
			billingPeriodId: input.billingPeriodId,
			startDate: input.dateRange.start,
			endDate: input.dateRange.end,
			energyType: input.energyType,
			fixedCost,
			totalCost: measuredCost.plus(fixedCost ?? 0).toNumber(),
			costPerUnit: costPerUnit.toNumber(),
			totalConsumption: totalConsumption.toNumber(),
			occupantId: occupant.id,
			measuredCost: measuredCost.toNumber()
		};
	});
}

/**
 * Sum consumption of all occupant's devices
 */
export function sumMeasuredConsumption(
	energyType: EnergyType,
	occupant: OccupantCalculationEntry
): BigNumber {
	const devices = getDevices(energyType, occupant);
	const totalMeasuredConsumption = sumPreciseBy(devices, (d) => d.consumption ?? 0);

	return totalMeasuredConsumption;
}

/**
 * Maps occupants' unmeasured consumption (based on area) to their EnergyBill insert values
 */
export function getUnmeasuredBills(
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

/**
 * Maps occupants' device consumption entries to ConsumptionRecord insert values
 */
export function getConsumptionRecords(
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

/**
 * Check if occupant has device consumptions for a given energy type
 */
export function hasDevices(energyType: EnergyType, occupant: OccupantCalculationEntry): boolean {
	return occupant.measuringDevices.some((device) => device.energyType === energyType);
}

/**
 * Checks whether an occupant is charged for an energy type based on their area
 */
export function isChargedByArea(
	energyType: EnergyType,
	occupant: OccupantCalculationEntry
): boolean {
	const unmeasuredChargeProperty = `chargedUnmeasured${capitalize(energyType)}` as const;

	return occupant[unmeasuredChargeProperty] === true;
}

/**
 * Get device consumptions
 */
function getDevices(energyType: EnergyType, occupant: OccupantCalculationEntry) {
	return occupant.measuringDevices.filter((device) => device.energyType === energyType);
}
