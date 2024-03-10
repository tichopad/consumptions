import { id, type ConsumptionRecord, type Occupant } from '$lib/models/schema';
import { describe, it, expect } from 'vitest';
import { getHeatingCostForOccupant } from './heating';

// Helpers

const createOccupant = (o: Partial<Occupant> = {}) => ({
	id: id(),
	name: 'Karlach Cliffgate',
	chargedUnmeasuredElectricity: true,
	chargedUnmeasuredHeating: false,
	chargedUnmeasuredWater: false,
	squareMeters: 40,
	buildingId: id(),
	heatingFixedCostShare: null,
	...o
});

const createConsumption = (c: Partial<ConsumptionRecord> = {}) => ({
	id: id(),
	startDate: new Date('2021-01-01'),
	endDate: new Date('2021-01-31'),
	measuringDeviceId: id(),
	consumption: 100,
	...c
});

// Fixtures

type OwnerWithFixedCostShareTestTuple = [
	name: string,
	values: {
		totalFixedCost: number;
		costPerGj: number;
		costPerSquareMeterOfArea: number;
		occupantFixedCostShare: number;
		consumption: number;
		expectedTotalToPrecision2: string;
		expectedFixedToPrecision2: string;
	}
];
const ownersWithFixedCostShare: OwnerWithFixedCostShareTestTuple[] = [
	[
		"McDonald's, Sep 23",
		{
			totalFixedCost: 65270.05,
			costPerGj: 300.4,
			consumption: 0,
			costPerSquareMeterOfArea: 34.43,
			occupantFixedCostShare: 100,
			expectedFixedToPrecision2: '8357.24',
			expectedTotalToPrecision2: '8357.24'
		}
	],
	[
		"McDonald's, Nov 23",
		{
			totalFixedCost: 65270.05,
			costPerGj: 446.19,
			costPerSquareMeterOfArea: 34.43,
			occupantFixedCostShare: 100,
			consumption: 15.31,
			expectedTotalToPrecision2: '15188.41',
			expectedFixedToPrecision2: '8357.24'
		}
	],
	[
		'Viktorka, Nov 23',
		{
			totalFixedCost: 65270.05,
			costPerGj: 446.19,
			costPerSquareMeterOfArea: 34.43,
			occupantFixedCostShare: 148,
			consumption: 68.8,
			expectedTotalToPrecision2: '43066.59',
			expectedFixedToPrecision2: '12368.72'
		}
	],
	[
		'Ambulance, Nov 23',
		{
			totalFixedCost: 65270.05,
			costPerGj: 446.19,
			costPerSquareMeterOfArea: 34.43,
			occupantFixedCostShare: 42.04,
			consumption: 18.87,
			expectedTotalToPrecision2: '11932.99',
			expectedFixedToPrecision2: '3513.38'
		}
	]
];

// Tests

describe('getHeatingCostForOccupant', () => {
	it('calculates cost for a renter without consumption records', () => {
		const occupant = createOccupant({
			chargedUnmeasuredHeating: true,
			heatingFixedCostShare: null,
			squareMeters: 25.49
		});
		const cost = getHeatingCostForOccupant(occupant, null, 88, 66.68, 65543);
		expect(cost.total.toFixed(2)).toBe('1699.67');
		expect(cost.fixed).toBe(0);
	});
	it('calculates cost for a renter with consumption records', () => {
		const costPerGj = 88;
		const costPerSquareMeterOfArea = 34.43;
		const occupant = createOccupant({
			chargedUnmeasuredHeating: true,
			squareMeters: 60
		});
		const records = [
			createConsumption({ consumption: 5.07 }),
			createConsumption({ consumption: 0.62 })
		];
		const totalFixedCost = 65_543;
		const cost = getHeatingCostForOccupant(
			occupant,
			records,
			costPerGj,
			costPerSquareMeterOfArea,
			totalFixedCost
		);
		expect(cost.total).toBe(2566.52);
		expect(cost.fixed).toBe(0);
	});
	it('calculates cost for a renter with fixed cost share', () => {
		const costPerGj = 88;
		const costPerSquareMeterOfArea = 34.43;
		const occupant = createOccupant({
			chargedUnmeasuredHeating: true,
			squareMeters: 60,
			heatingFixedCostShare: 10
		});
		const records = [createConsumption({ consumption: 0.62 })];
		const totalFixedCost = 65_543;
		const cost = getHeatingCostForOccupant(
			occupant,
			records,
			costPerGj,
			costPerSquareMeterOfArea,
			totalFixedCost
		);
		expect(cost.total.toFixed(2)).toBe('2959.58');
		expect(cost.fixed.toFixed(2)).toBe('839.22');
	});
	it('calculates cost for an owner with consumption records and fixed cost share', () => {
		const costPerGj = 446.19;
		const costPerSquareMeterOfArea = 34.43;
		const totalFixedCost = 65270.05;

		const mcDonalds = createOccupant({
			name: "McDonald's",
			chargedUnmeasuredHeating: false,
			heatingFixedCostShare: 100
		});
		const mcdRecords = [createConsumption({ consumption: 15.31 })];
		const mcdCost = getHeatingCostForOccupant(
			mcDonalds,
			mcdRecords,
			costPerGj,
			costPerSquareMeterOfArea,
			totalFixedCost
		);
		expect(mcdCost.total.toFixed(2)).toBe('15188.41');
		expect(mcdCost.fixed.toFixed(2)).toBe('8357.24');

		const restaurant = createOccupant({
			name: 'Restaurant',
			chargedUnmeasuredHeating: false,
			heatingFixedCostShare: 148
		});
		const restaurantRecords = [createConsumption({ consumption: 68.8 })];
		const restaurantCost = getHeatingCostForOccupant(
			restaurant,
			restaurantRecords,
			446.19,
			costPerSquareMeterOfArea,
			totalFixedCost
		);
		expect(restaurantCost.total.toFixed(2)).toBe('43066.59');
		expect(restaurantCost.fixed.toFixed(2)).toBe('12368.72');
	});
	it('calculates cost for an owner with consumption records and no fixed cost share', () => {
		const totalFixedCost = 65270.05;
		const costPerGj = 446.19;
		const costPerSquareMeterOfArea = 34.43;
		const occupant = createOccupant({
			chargedUnmeasuredHeating: false
		});
		const records = [createConsumption({ consumption: 15.31 })];
		const mcdCost = getHeatingCostForOccupant(
			occupant,
			records,
			costPerGj,
			costPerSquareMeterOfArea,
			totalFixedCost
		);
		expect(mcdCost.total.toFixed(2)).toBe('6831.17');
		expect(mcdCost.fixed).toBe(0);
	});
	it('calculates cost for an owner only fixed cost share', () => {
		const totalFixedCost = 65270.05;
		const costPerGj = 446.19;
		const costPerSquareMeterOfArea = 34.43;
		const occupant = createOccupant({
			chargedUnmeasuredHeating: false,
			heatingFixedCostShare: 476.92
		});
		const cost = getHeatingCostForOccupant(
			occupant,
			null,
			costPerGj,
			costPerSquareMeterOfArea,
			totalFixedCost
		);
		expect(cost.total).toBe(cost.fixed);
		expect(cost.total.toFixed(2)).toBe('39857.35');
		expect(cost.fixed.toFixed(2)).toBe('39857.35');
	});
	it.each(ownersWithFixedCostShare)(
		'calculates cost for owner (%s) with fixed cost share',
		(name, values) => {
			const occupant = createOccupant({
				name,
				chargedUnmeasuredHeating: false,
				heatingFixedCostShare: values.occupantFixedCostShare
			});
			const records = [createConsumption({ consumption: values.consumption })];
			const cost = getHeatingCostForOccupant(
				occupant,
				records,
				values.costPerGj,
				values.costPerSquareMeterOfArea,
				values.totalFixedCost
			);
			expect(cost.total.toFixed(2)).toBe(values.expectedTotalToPrecision2);
			expect(cost.fixed.toFixed(2)).toBe(values.expectedFixedToPrecision2);
		}
	);
});
