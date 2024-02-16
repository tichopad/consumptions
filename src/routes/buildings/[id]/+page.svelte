<script lang="ts">
	export let data;

	import * as Table from '$lib/components/ui/table';
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
		<h2 class="text-xl font-bold mt-4 mb-2">Occupants</h2>
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
						<Table.Cell></Table.Cell>
						<Table.Cell class="text-right pl-0">
							<a href={`/occupants/${occupant.id}`} class="block">{occupant.squareMeters}</a>
						</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	</div>

	<h2 class="text-lg font-bold mt-4 mb-2">Energy Bills:</h2>
	<ul>
		{#each data.building.energyBills as bill}
			<li class="mb-2">
				<span class="font-bold">{bill.energyType}, {bill.startDate.toISOString()}</span>
			</li>
		{/each}
	</ul>
</main>
