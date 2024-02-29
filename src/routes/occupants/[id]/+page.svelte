<script lang="ts">
	export let data;
	export let form;

	import * as Table from '$lib/components/ui/table';
	import { Button } from '$lib/components/ui/button';
	import AddMeasuringDeviceFormDialog from './add-device-dialog.svelte';

	let isDialogOpen = false;
	const openDialog = () => {
		isDialogOpen = true;
	};
	const closeDialog = () => {
		isDialogOpen = false;
	};

	$: console.log('form', form);
	$: console.log('data', data);
</script>

<main
	class="flex min-h-[calc(100vh_-_theme(spacing.16))] flex-1 flex-col gap-4 p-4 md:gap-8 md:p-10"
>
	<div>
		<p class="text-sm text-gray-500 dark:text-gray-400">Occupant</p>
		<h1 class="text-2xl font-bold py-2">{data.occupant.name}</h1>
		<p class="text-gray-500 dark:text-gray-400">{data.occupant.squareMeters} m²</p>
	</div>

	<div>
		<div class="flex items-center justify-between">
			<h2 class="text-xl font-bold py-2">Measuring devices</h2>
			<Button variant="outline" on:click={openDialog}>Add</Button>
		</div>
		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head>Name</Table.Head>
					<Table.Head class="text-right">Type</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each data.occupant.measuringDevices as device (device.id)}
					<Table.Row class="hover:bg-slate-100">
						<Table.Cell class="font-medium whitespace-nowrap pr-0">
							{device.name}
						</Table.Cell>
						<Table.Cell class="text-right">{device.energyType}</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	</div>
</main>

<AddMeasuringDeviceFormDialog occupantId={data.occupant.id} open={isDialogOpen} data={data.form} />
