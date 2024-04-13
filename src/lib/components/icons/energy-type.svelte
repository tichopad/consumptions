<script lang="ts">
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { labelsByEnergyType, type EnergyType } from '$lib/models/common';
	import { cn } from '$lib/components/ui/utils';
	import type { ComponentType } from 'svelte';
	import DropletsIcon from './droplets.svelte';
	import FlameIcon from './flame.svelte';
	import LightbulbIcon from './lightbulb.svelte';

	/** Energy type the icon represents */
	export let energyType: EnergyType;
	/** Whether to render the icon with a hoverable tooltip */
	export let withTooltip = true;

	const iconByEnergyType = {
		electricity: LightbulbIcon,
		water: DropletsIcon,
		heating: FlameIcon
	} as const satisfies Record<EnergyType, ComponentType>;
</script>

{#if withTooltip}
	<Tooltip.Root openDelay={300}>
		<Tooltip.Trigger>
			<svelte:component
				this={iconByEnergyType[energyType]}
				class={cn(
					{
						'text-yellow-500': energyType === 'electricity',
						'text-blue-600': energyType === 'water',
						'text-red-600': energyType === 'heating'
					},
					$$props.class
				)}
			/>
		</Tooltip.Trigger>
		<Tooltip.Content>{labelsByEnergyType[energyType]}</Tooltip.Content>
	</Tooltip.Root>
{:else}
	<svelte:component
		this={iconByEnergyType[energyType]}
		class={cn(
			{
				'text-yellow-500': energyType === 'electricity',
				'text-blue-600': energyType === 'water',
				'text-red-600': energyType === 'heating'
			},
			$$props.class
		)}
		title={labelsByEnergyType[energyType]}
	/>
{/if}
