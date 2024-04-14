<script lang="ts">
	import EnergyTypeIcon from '$lib/components/icons/energy-type.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Table from '$lib/components/ui/table';
	import Header1 from '$lib/components/ui/typography/header1.svelte';
	import Header2 from '$lib/components/ui/typography/header2.svelte';
	import Page from '$lib/components/ui/typography/page.svelte';
	import { labelsByEnergyType } from '$lib/models/common';
	import { DotsHorizontal as DotsHorizontalIcon } from 'svelte-radix';
	import AddMeasuringDeviceFormDialog from './add-device-dialog.svelte';
	import EditForm from './edit-form.svelte';

	export let data;

	$: isDeviceDialogOpen = false;
</script>

<AddMeasuringDeviceFormDialog
	bind:open={isDeviceDialogOpen}
	data={data.insertMeasuringDeviceForm}
	occupant={data.occupant}
/>

<Page>
	<section slot="header">
		<Header2>Occupant</Header2>
		<Header1>{data.occupant.name}</Header1>
	</section>
	<Card.Root>
		<Card.Header>
			<Card.Title>About</Card.Title>
			<Card.Description>Basic information about the occupant.</Card.Description>
		</Card.Header>
		<Card.Content>
			<EditForm data={data.editOccupantForm} occupant={data.occupant} />
		</Card.Content>
	</Card.Root>
	<Card.Root>
		<Card.Header>
			<Card.Title class="flex justify-between items-center -my-2">
				<span>Measuring devices</span>
				<Button on:click={() => (isDeviceDialogOpen = true)}>Add device</Button>
			</Card.Title>
			<Card.Description>List of all the occupant's measuring devices</Card.Description>
		</Card.Header>
		<Card.Content>
			{#if data.occupant.measuringDevices.length === 0}
				<p class="text-sm text-muted-foreground">
					This occupant has no devices yet. Click Add device to add a new one.
				</p>
			{:else}
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head class="w-[100px]">Type</Table.Head>
							<Table.Head>Name</Table.Head>
							<Table.Head class="w-9"><span class="sr-only">Action</span></Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each data.occupant.measuringDevices as device (device.id)}
							<Table.Row>
								<Table.Cell>
									<div class="flex gap-1 items-center font-medium">
										<EnergyTypeIcon
											class="w-4 h-4"
											energyType={device.energyType}
											withTooltip={false}
										/>
										{labelsByEnergyType[device.energyType]}
									</div>
								</Table.Cell>
								<Table.Cell>{device.name}</Table.Cell>
								<Table.Cell>
									<Button variant="outline" size="icon">
										<DotsHorizontalIcon class="w-4 h-4" />
									</Button>
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			{/if}
		</Card.Content>
	</Card.Root>
</Page>
