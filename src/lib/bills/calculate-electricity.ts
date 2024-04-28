import type { EnergyType, ID } from '$lib/models/common';
import type { ConsumptionRecordInsert } from '$lib/models/consumption-record';
import type { EnergyBillInsert } from '$lib/models/energy-bill';
import type { MeasuringDevice } from '$lib/models/measuring-device';
import type { Occupant } from '$lib/models/occupant';
import { sumPreciseBy } from '$lib/utils';
import BigNumber from 'bignumber.js';

type MeasuringDeviceBillRecord = Pick<MeasuringDevice, 'id' | 'name' | 'energyType'> & {
	consumption?: number;
};
type DateRange = {
	start: Date;
	end: Date;
};
type OccupantWithMeasuringDevices = Occupant & {
	measuringDevices: MeasuringDeviceBillRecord[];
};
type CalculateElectricityBillsInput = {
	billingPeriodId: ID;
	buildingId: ID;
	consumption: number;
	totalCost: number;
	dateRange: DateRange;
	occupants: OccupantWithMeasuringDevices[];
};
type CalculateElectricityBillsOutput = {
	billsToInsert: EnergyBillInsert[];
	consumptionRecordsToInsert: ConsumptionRecordInsert[];
};

/**
 * Calculates electricity bills and consumption records and returns the database records
 * for insertion.
 */
export function calculateElectricityBills(
	input: CalculateElectricityBillsInput
): CalculateElectricityBillsOutput {
	const consumption = new BigNumber(input.consumption);
	const totalCost = new BigNumber(input.totalCost);

	const costPerUnit = totalCost.dividedBy(consumption);

	// Occupants with measuring devices

	const occupantsMeasured = input.occupants.filter(hasElectricMeasuringDevices);

	const consumptionRecords: ConsumptionRecordInsert[] = getConsumptionRecords(
		input.occupants,
		input.dateRange
	);

	const billsMeasured: EnergyBillInsert[] = occupantsMeasured.map((occupant) => {
		const totalConsumption = sumMeasuredConsumption(occupant);
		const measuredCost = totalConsumption.times(costPerUnit).toNumber();
		return {
			billingPeriodId: input.billingPeriodId,
			startDate: input.dateRange.start,
			endDate: input.dateRange.end,
			energyType: 'electricity' as const,
			totalCost: measuredCost,
			costPerUnit: costPerUnit.toNumber(),
			totalConsumption: totalConsumption.toNumber(),
			occupantId: occupant.id,
			measuredCost
		};
	});

	// Figure out what remains to be split

	const totalCostForMeasuredConsumption = sumPreciseBy(billsMeasured, (b) => b.measuredCost ?? 0);
	const totalAreaOfUnmeasuredOccupants = sumPreciseBy(occupantsMeasured, (o) => o.squareMeters);
	const remainingCostToSplit = totalCost.minus(totalCostForMeasuredConsumption);
	const costPerSquareMeter = remainingCostToSplit.div(totalAreaOfUnmeasuredOccupants);

	// Occupants charged based on their occupied area

	const occupantsUnmeasured = input.occupants.filter(isChargedByArea);

	const billsUnmeasured: EnergyBillInsert[] = occupantsUnmeasured.map((occupant) => ({
		billingPeriodId: input.billingPeriodId,
		billedArea: occupant.squareMeters,
		costPerSquareMeter: costPerSquareMeter.toNumber(),
		startDate: input.dateRange.start,
		endDate: input.dateRange.end,
		energyType: 'electricity' as const,
		occupantId: occupant.id,
		totalCost: costPerSquareMeter.times(occupant.squareMeters).toNumber()
	}));

	// And finally bill for the entire building

	const billForBuilding: EnergyBillInsert = {
		billingPeriodId: input.billingPeriodId,
		buildingId: input.buildingId,
		costPerSquareMeter: costPerSquareMeter.toNumber(),
		costPerUnit: costPerUnit.toNumber(),
		startDate: input.dateRange.start,
		endDate: input.dateRange.end,
		energyType: 'electricity' as const,
		totalConsumption: consumption.toNumber(),
		totalCost: totalCost.toNumber()
	};

	return {
		billsToInsert: billsMeasured.concat(billsUnmeasured, billForBuilding),
		consumptionRecordsToInsert: consumptionRecords
	};
}

// -- Helpers --

function getConsumptionRecords(occupants: OccupantWithMeasuringDevices[], dateRange: DateRange) {
	const devices = occupants.flatMap(getElectricityMeasuringDevices);

	return devices.map((device) => ({
		consumption: device.consumption ?? 0,
		startDate: dateRange.start,
		endDate: dateRange.end,
		energyType: 'electricity' as const,
		measuringDeviceId: device.id
	}));
}

function sumMeasuredConsumption(occupant: OccupantWithMeasuringDevices) {
	const devices = getElectricityMeasuringDevices(occupant);
	const totalConsumption = sumPreciseBy(devices, (d) => d.consumption ?? 0);
	return totalConsumption;
}

function getElectricityMeasuringDevices(occupant: OccupantWithMeasuringDevices) {
	return occupant.measuringDevices.filter(isElectricityType);
}

function hasElectricMeasuringDevices(occupant: OccupantWithMeasuringDevices) {
	return occupant.measuringDevices.some(isElectricityType);
}

function isChargedByArea(occupant: Occupant) {
	return occupant.chargedUnmeasuredElectricity === true;
}

function isElectricityType(item: { energyType: EnergyType }) {
	return item.energyType === 'electricity';
}
