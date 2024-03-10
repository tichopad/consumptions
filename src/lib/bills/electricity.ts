import type { ConsumptionRecord, Occupant } from '$lib/models/schema';
import BigNumber from 'bignumber.js';

/**
 * Calculate the cost of electricity for an occupant.
 *
 * @param occupant - The occupant for whom to calculate the cost.
 * @param records - The consumption records for the occupant.
 * @param costPerKwh - The cost per kWh of electricity.
 * @param costPerSquareMeterOfArea - The electricity cost per square meter of occupant's area.
 */
export function getElectricityCostForOccupant(
	occupant: Occupant,
	records: ConsumptionRecord[] | null,
	costPerKwh: number,
	costPerSquareMeterOfArea: number
): number {
	if (occupant.chargedUnmeasuredElectricity === false && !records?.length) {
		throw new Error(
			'Occupant is only charged for measured electricity consumption, but no records were given.'
		);
	}

	let total = new BigNumber(0);

	// If the occupant is charged for unmeasured electricity, calculate the cost.
	if (occupant.chargedUnmeasuredElectricity === true) {
		const costPerSquareMeterOfAreaBig = new BigNumber(costPerSquareMeterOfArea);
		total = total.plus(costPerSquareMeterOfAreaBig.multipliedBy(occupant.squareMeters));
	}

	// If the occupant has consumption records, calculate the cost.
	if (records) {
		const costPerKwhBig = new BigNumber(costPerKwh);
		for (const record of records) {
			const consumptionBig = new BigNumber(record.consumption);
			total = total.plus(consumptionBig.multipliedBy(costPerKwhBig));
		}
	}

	return total.toNumber();
}
