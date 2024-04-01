<script lang="ts">
	import type { EnergyType } from '$lib/models/common';
	import { cn } from '$lib/utils';
	import type { ComponentType } from 'svelte';
	import DropletsIcon from './droplets.svelte';
	import FlameIcon from './flame.svelte';
	import LightbulbIcon from './lightbulb.svelte';

	export let energyType: EnergyType;

	const iconByEnergyType = {
		electricity: LightbulbIcon,
		water: DropletsIcon,
		heating: FlameIcon
	} as const satisfies Record<EnergyType, ComponentType>;
</script>

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
