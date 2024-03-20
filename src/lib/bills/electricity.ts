import type { Occupant } from '$lib/models/schema';
import BigNumber from 'bignumber.js';

/**
 * Calculate the cost of electricity for an occupant.
 *
 * @param occupant - The occupant for whom to calculate the cost.
 * @param consumption - Total consumption in kWh for the occupant.
 * @param costPerKwh - The cost per kWh of electricity.
 * @param costPerSquareMeterOfArea - The electricity cost per square meter of occupant's area.
 */
export function getElectricityCostForOccupant(
	occupant: Occupant,
	totalConsumption: number | null,
	costPerKwh: number,
	costPerSquareMeterOfArea?: number // FIXME: cover with unit tests
): number {
	// TODO: write invariant helpers
	if (occupant.chargedUnmeasuredElectricity === false && totalConsumption === null) {
		throw new Error(
			'Occupant is only charged for measured electricity consumption, but no consumption was given.'
		);
	}
	if (occupant.chargedUnmeasuredElectricity && costPerSquareMeterOfArea === undefined) {
		throw new Error(
			'Occupant is charged for unmeasured electricity, but no cost per square meter was given.'
		);
	}

	let total = new BigNumber(0);

	// If the occupant is charged for unmeasured electricity, calculate the cost.
	if (occupant.chargedUnmeasuredElectricity === true && costPerSquareMeterOfArea !== undefined) {
		const costPerSquareMeterOfAreaBig = new BigNumber(costPerSquareMeterOfArea);
		total = total.plus(costPerSquareMeterOfAreaBig.multipliedBy(occupant.squareMeters));
	}

	// If the occupant has consumptions, calculate the cost.
	if (totalConsumption !== null) {
		const costPerKwhBig = new BigNumber(costPerKwh);
		const consumptionBig = new BigNumber(totalConsumption);
		total = total.plus(consumptionBig.multipliedBy(costPerKwhBig));
	}

	return total.toNumber();
}
