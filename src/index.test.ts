import { id } from '$lib/models/schema';
import type {
	Building,
	ConsumptionRecord,
	EnergyBill,
	MeasuringDevice,
	Occupant
} from '$lib/models/schema';
import { describe, it, expect, test } from 'vitest';

const building: Building = {
	id: id(),
	name: 'Stadion',
	squareMeters: 1000
};
const renterA: Occupant = {
	id: id(),
	name: 'John Renter',
	buildingId: building.id,
	chargedUnmeasuredElectricity: true,
	chargedUnmeasuredHeating: true,
	chargedUnmeasuredWater: true,
	squareMeters: 40
};
const renterB: Occupant = {
	id: id(),
	name: 'Kyle Renter',
	buildingId: building.id,
	chargedUnmeasuredElectricity: true,
	chargedUnmeasuredHeating: true,
	chargedUnmeasuredWater: true,
	squareMeters: 35
};
const ownerA: Occupant = {
	id: id(),
	name: 'Jane Owner',
	buildingId: building.id,
	chargedUnmeasuredElectricity: false,
	chargedUnmeasuredHeating: false,
	chargedUnmeasuredWater: false,
	heatingFixedCostShare: 1.05,
	squareMeters: 50
};
const electricityMeasuringDeviceA: MeasuringDevice = {
	energyType: 'electricity',
	id: id(),
	name: 'Electricity meter for Jane Owner',
	occupantId: ownerA.id
};
const heatingMeasuringDeviceA: MeasuringDevice = {
	energyType: 'heating',
	id: id(),
	name: 'Heating meter for Jane Owner',
	occupantId: ownerA.id
};
const waterMeasuringDeviceA: MeasuringDevice = {
	energyType: 'water',
	id: id(),
	name: 'Water meter for Jane Owner',
	occupantId: ownerA.id
};
const ownerB: Occupant = {
	id: id(),
	name: 'Kate Owner',
	buildingId: building.id,
	chargedUnmeasuredElectricity: false,
	chargedUnmeasuredHeating: false,
	chargedUnmeasuredWater: false,
	heatingFixedCostShare: 1.2,
	squareMeters: 60
};
const electricityMeasuringDeviceB: MeasuringDevice = {
	energyType: 'electricity',
	id: id(),
	name: 'Electricity meter for Kate Owner',
	occupantId: ownerB.id
};
const heatingMeasuringDeviceB: MeasuringDevice = {
	energyType: 'heating',
	id: id(),
	name: 'Heating meter for Kate Owner',
	occupantId: ownerB.id
};
const waterMeasuringDeviceB: MeasuringDevice = {
	energyType: 'water',
	id: id(),
	name: 'Water meter for Kate Owner',
	occupantId: ownerB.id
};

const startDate = new Date();
const endDate = new Date(startDate.getTime());
endDate.setMonth(endDate.getMonth() + 1);

const electricityConsumptionOfOwnerA: ConsumptionRecord = {
	id: id(),
	consumption: 100,
	measuringDeviceId: electricityMeasuringDeviceA.id,
	startDate,
	endDate,
	unmeasured: false
};
const heatingConsumptionOfOwnerA: ConsumptionRecord = {
	id: id(),
	consumption: 200,
	measuringDeviceId: heatingMeasuringDeviceA.id,
	startDate,
	endDate,
	unmeasured: false
};
const electricityConsumptionOfOwnerB: ConsumptionRecord = {
	id: id(),
	consumption: 150,
	measuringDeviceId: electricityMeasuringDeviceB.id,
	startDate,
	endDate,
	unmeasured: false
};

const buildingElectricityBill: EnergyBill = {
	id: id(),
	buildingId: building.id,
	occupantId: null,
	energyType: 'electricity',
	startDate,
	endDate,
	totalCost: 150_000,
	fixedCost: null
};
const buildingHeatingBill: EnergyBill = {
	id: id(),
	buildingId: building.id,
	occupantId: null,
	energyType: 'heating',
	startDate,
	endDate,
	totalCost: 250_000,
	fixedCost: 50_000
};
const buildingWaterBill: EnergyBill = {
	id: id(),
	buildingId: building.id,
	occupantId: null,
	energyType: 'water',
	startDate,
	endDate,
	totalCost: 200_000,
	fixedCost: null
};

const ELECTRICITY_COST = 6; // per kWh

test("Building's electricity bill is correctly divvied among occupants", () => {
	const consumptionsForOccupantsWithMeasuringDevices = [
		[ownerA, electricityConsumptionOfOwnerA],
		[ownerB, electricityConsumptionOfOwnerB]
	] as const;
	const billsForOccupantsWithMeasuringDevices = consumptionsForOccupantsWithMeasuringDevices.map(
		([occupant, consumption]): EnergyBill => {
			const totalCost = (consumption.consumption ?? 0) * ELECTRICITY_COST;
			return {
				id: id(),
				occupantId: occupant.id,
				energyType: 'electricity',
				startDate,
				endDate,
				totalCost,
				fixedCost: null,
				buildingId: null
			};
		}
	);
	const totalCostForOccupantsWithMeasuringDevices = billsForOccupantsWithMeasuringDevices.reduce(
		(sum, bill) => sum + bill.totalCost,
		0
	);
	expect(totalCostForOccupantsWithMeasuringDevices).toBe((100 + 150) * ELECTRICITY_COST);

	const occupantsWithoutMeasuringDevices = [renterA, renterB];
	const totalSquareMetersForOccupantsWithoutMeasuringDevices =
		occupantsWithoutMeasuringDevices.reduce((sum, occupant) => sum + occupant.squareMeters, 0);
	const totalCostRemaining =
		buildingElectricityBill.totalCost - totalCostForOccupantsWithMeasuringDevices;
	const costPerSquareMeterForOccupantsWithoutMeasuringDevices =
		totalCostRemaining / totalSquareMetersForOccupantsWithoutMeasuringDevices;

	const billsForOccupantsWithoutMeasuringDevices = occupantsWithoutMeasuringDevices.map(
		(occupant): EnergyBill => {
			const totalCost =
				costPerSquareMeterForOccupantsWithoutMeasuringDevices * occupant.squareMeters;
			return {
				id: id(),
				occupantId: occupant.id,
				energyType: 'electricity',
				startDate,
				endDate,
				totalCost,
				fixedCost: null,
				buildingId: null
			};
		}
	);

	const totalCostForOccupantsWithoutMeasuringDevices =
		billsForOccupantsWithoutMeasuringDevices.reduce((sum, bill) => sum + bill.totalCost, 0);

	expect(totalCostForOccupantsWithoutMeasuringDevices).toBe(
		buildingElectricityBill.totalCost - totalCostForOccupantsWithMeasuringDevices
	);

	const totalCostForOccupants =
		totalCostForOccupantsWithMeasuringDevices + totalCostForOccupantsWithoutMeasuringDevices;
	expect(totalCostForOccupants).toBe(buildingElectricityBill.totalCost);
});
