import type { ConsumptionRecord, Occupant } from '$lib/models/schema';
import BigNumber from 'bignumber.js';

type HeatingCost = {
	fixed: number;
	total: number;
};

// The constant used to divide the total fixed cost to get the fixed cost unit.
// This is heurestically defined by the accountant.
const FIXED_PRICE_UNIT_DIVIDER_CONSTANT = 781;

/**
 * Calculate the cost of heating for an occupant.
 *
 * @param occupant - The occupant for whom to calculate the cost.
 * @param records - The consumption records for the occupant.
 * @param costPerGj - The cost per kW/GJ of heating.
 * @param costPerSquareMeterOfArea - The heating cost per square meter of occupant's area.
 * @param totalFixedCost - The total fixed cost of heating for all occupants in given timeframe.
 */
export function getHeatingCostForOccupant(
	occupant: Occupant,
	records: ConsumptionRecord[] | null,
	costPerGj: number,
	costPerSquareMeterOfArea: number,
	totalFixedCost: number
): HeatingCost {
	let total = new BigNumber(0);
	let fixed = new BigNumber(0);

	// If the occupant is charged for fixed cost, calculate the fixed cost.
	if (occupant.heatingFixedCostShare !== null) {
		const totalFixedCostBig = new BigNumber(totalFixedCost);
		const fixedCostUnit = totalFixedCostBig.dividedBy(FIXED_PRICE_UNIT_DIVIDER_CONSTANT);
		fixed = fixedCostUnit.multipliedBy(occupant.heatingFixedCostShare);
		total = total.plus(fixed);
	}

	// If the occupant is charged for unmeasured heating, calculate the cost.
	if (occupant.chargedUnmeasuredHeating === true) {
		const costPerSquareMeterOfAreaBig = new BigNumber(costPerSquareMeterOfArea);
		total = total.plus(costPerSquareMeterOfAreaBig.multipliedBy(occupant.squareMeters));
	}

	// If the occupant has consumption records, calculate the cost.
	if (records !== null) {
		const costPerGjBig = new BigNumber(costPerGj);
		for (const record of records) {
			const consumptionBig = new BigNumber(record.consumption);
			total = total.plus(consumptionBig.multipliedBy(costPerGjBig));
		}
	}

	return {
		fixed: fixed.toNumber(),
		total: total.toNumber()
	};
}
