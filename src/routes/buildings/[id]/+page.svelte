<script lang="ts">
	export let data;

	import * as Table from '$lib/components/ui/table';
	import LightbulbIcon from '$lib/components/icons/lightbulb.svelte';
	import DropletsIcon from '$lib/components/icons/droplets.svelte';
	import FlameIcon from '$lib/components/icons/flame.svelte';
</script>

<main
	class="flex min-h-[calc(100vh_-_theme(spacing.16))] flex-1 flex-col gap-4 p-4 md:gap-8 md:p-10"
>
	<!-- <a href="/buildings" class="text-gray-500 hover:text-gray-700"> ←&nbsp;Back </a> -->
	<div>
		<p class="text-sm text-gray-500 dark:text-gray-400">Building</p>
		<h1 class="text-2xl font-bold py-2">{data.building.name}</h1>
		<p class="text-gray-500 dark:text-gray-400">{data.building.squareMeters} m²</p>
	</div>

	<div>
		<h2 class="text-xl font-bold py-2">Occupants</h2>
		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head>Name</Table.Head>
					<Table.Head class="text-right">Fixed heating share</Table.Head>
					<Table.Head class="text-right">Charged based on area</Table.Head>
					<Table.Head class="text-right">Area (m²)</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each data.building.occupants as occupant (occupant.id)}
					<Table.Row class="hover:bg-slate-100">
						<Table.Cell class="font-medium whitespace-nowrap pr-0">
							<a href={`/occupants/${occupant.id}`} class="block">{occupant.name}</a>
						</Table.Cell>
						<Table.Cell
							class={`text-right ${occupant.heatingFixedCostShare === null ? 'text-gray-400' : ''}`}
						>
							{occupant.heatingFixedCostShare?.toFixed(2) ?? 'None'}</Table.Cell
						>
						<Table.Cell>
							<div class="flex justify-end">
								{#if occupant.chargedUnmeasuredElectricity}
									<LightbulbIcon class="w-4 h-4 text-yellow-600" />
								{/if}
								{#if occupant.chargedUnmeasuredWater}
									<DropletsIcon class="w-4 h-4 text-blue-600" />
								{/if}
								{#if occupant.chargedUnmeasuredHeating}
									<FlameIcon class="w-4 h-4 text-red-600" />
								{/if}
								{#if !occupant.chargedUnmeasuredElectricity && !occupant.chargedUnmeasuredWater && !occupant.chargedUnmeasuredHeating}
									<span class="text-gray-400">No</span>
								{/if}
							</div>
						</Table.Cell>
						<Table.Cell class="text-right pl-0">
							<a href={`/occupants/${occupant.id}`} class="block">{occupant.squareMeters}</a>
						</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	</div>

	<div>
		<h2 class="text-xl font-bold py-2">Energy Bills</h2>
		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head>Type</Table.Head>
					<Table.Head>From</Table.Head>
					<Table.Head>To</Table.Head>
					<Table.Head class="text-right">Fixed cost</Table.Head>
					<Table.Head class="text-right">Total cost</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each data.building.energyBills as bill (bill.id)}
					<Table.Row class="hover:bg-slate-100">
						<Table.Cell class="font-medium">
							<a href={`/energy-bills/${bill.id}`}>
								{bill.energyType.charAt(0).toUpperCase() + bill.energyType.slice(1)}
							</a>
						</Table.Cell>
						<Table.Cell>{bill.startDate.toLocaleDateString()}</Table.Cell>
						<Table.Cell>{bill.endDate.toLocaleDateString()}</Table.Cell>
						<Table.Cell class="text-right">
							{#if bill.fixedCost === null}
								<span class="text-gray-400">None</span>
							{:else}
								{bill.fixedCost.toLocaleString()}&nbsp;CZK
							{/if}
						</Table.Cell>
						<Table.Cell class="font-medium text-right"
							>{bill.totalCost.toLocaleString()}&nbsp;<span class="font-normal">CZK</span
							></Table.Cell
						>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	</div>
</main>
