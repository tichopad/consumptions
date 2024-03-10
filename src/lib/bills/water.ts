import type { ConsumptionRecord, Occupant } from '$lib/models/schema';
import BigNumber from 'bignumber.js';

/**
 * Calculate the cost of water for an occupant.
 *
 * @param occupant - The occupant for whom to calculate the cost.
 * @param records - The consumption records for the occupant.
 * @param costPerCubicMeterOfWater - The cost per liter of water.
 * @param costPerSquareMeterOfArea - The water cost per square meter of occupant's area.
 */
export function getWaterCostForOccupant(
	occupant: Occupant,
	records: ConsumptionRecord[] | null,
	costPerCubicMeterOfWater: number,
	costPerSquareMeterOfArea: number
): number {
	if (occupant.chargedUnmeasuredWater === false && !records?.length) {
		throw new Error(
			'Occupant is only charged for measured water consumption, but no records were given.'
		);
	}

	let total = new BigNumber(0);

	// If the occupant is charged for unmeasured water, calculate the cost.
	if (occupant.chargedUnmeasuredWater === true) {
		const costPerSquareMeterOfAreaBig = new BigNumber(costPerSquareMeterOfArea);
		total = total.plus(costPerSquareMeterOfAreaBig.multipliedBy(occupant.squareMeters));
	}

	// If the occupant has consumption records, calculate the cost.
	if (records) {
		const costPerCubicMeterOfWaterBig = new BigNumber(costPerCubicMeterOfWater);
		for (const record of records) {
			const consumptionBig = new BigNumber(record.consumption);
			total = total.plus(consumptionBig.multipliedBy(costPerCubicMeterOfWaterBig));
		}
	}

	return total.toNumber();
}
