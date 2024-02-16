<script lang="ts">
	export let data;

	import * as Table from '$lib/components/ui/table';
</script>

<main
	class="flex min-h-[calc(100vh_-_theme(spacing.16))] flex-1 flex-col gap-4 p-4 md:gap-8 md:p-10"
>
	<div>
		<h1 class="text-2xl font-bold py-2">Buildings</h1>
		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head>Name</Table.Head>
					<Table.Head class="text-right">Area (m²)</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each data.buildings as building (building.id)}
					<Table.Row class="hover:bg-slate-100">
						<Table.Cell class="font-medium pr-0"
							><a href={`/buildings/${building.id}`} class="block">{building.name}</a></Table.Cell
						>
						<Table.Cell class="text-right pl-0"
							><a href={`/buildings/${building.id}`} class="block">{building.squareMeters}</a
							></Table.Cell
						>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	</div>
</main>
