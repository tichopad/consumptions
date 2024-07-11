import type { EnergyType } from '$lib/models/common';
import type { Occupant } from '$lib/models/occupant';
import { capitalize } from '$lib/utils';

type OccupantWithMeasurements = Pick<
	Occupant,
	'chargedUnmeasuredElectricity' | 'chargedUnmeasuredHeating' | 'chargedUnmeasuredWater'
>;

/**
 * Checks whether an occupant is charged for any energy type based on their area
 */
export function isChargedForAnyUnmeasuredEnergy(occupant: OccupantWithMeasurements): boolean {
	return (
		occupant.chargedUnmeasuredElectricity ||
		occupant.chargedUnmeasuredHeating ||
		occupant.chargedUnmeasuredWater
	);
}

/**
 * Checks whether an occupant is charged for a specific energy type based on their area
 */
export function isChargedForUnmeasuredEnergy(
	energyType: EnergyType,
	occupant: OccupantWithMeasurements
): boolean {
	const unmeasuredChargeProperty = `chargedUnmeasured${capitalize(energyType)}` as const;

	return occupant[unmeasuredChargeProperty] === true;
}
