<script lang="ts">
	import EnergyTypeIcon from '$lib/components/icons/energy-type.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Table from '$lib/components/ui/table';
	import Header1 from '$lib/components/ui/typography/header1.svelte';
	import Header2 from '$lib/components/ui/typography/header2.svelte';
	import Page from '$lib/components/ui/typography/page.svelte';
	import { labelsByEnergyType } from '$lib/models/common';
	import type { MeasuringDevice } from '$lib/models/measuring-device';
	import type { ButtonEventHandler } from 'bits-ui';
	import { Trash as TrashIcon } from 'svelte-radix';
	import AddDeviceForm from './add-device-form.svelte';
	import DeleteDeviceForm from './delete-device-form.svelte';
	import EditDeviceForm from './edit-device-form.svelte';
	import EditForm from './edit-form.svelte';

	export let data;

	// Add device dialog controls
	let isAddDeviceDialogOpen = false;

	// Current device for edit and delete dialogs
	let selectedDevice: MeasuringDevice | null = null;

	// Edit device dialog controls
	let isEditDeviceDialogOpen = false;
	const openEditDevice = (device: MeasuringDevice) => () => {
		selectedDevice = device;
		isEditDeviceDialogOpen = true;
	};

	// Delete device dialog controls
	let isDeleteDeviceDialogOpen = false;
	const openDeleteDevice = (device: MeasuringDevice) => (event: ButtonEventHandler<MouseEvent>) => {
		// Prevent the containing rows from capturing the event
		event.stopPropagation();
		selectedDevice = device;
		isDeleteDeviceDialogOpen = true;
	};
</script>

<AddDeviceForm
	bind:open={isAddDeviceDialogOpen}
	data={data.insertMeasuringDeviceForm}
	occupant={data.occupant}
/>

<EditDeviceForm
	bind:open={isEditDeviceDialogOpen}
	data={data.editMeasuringDeviceForm}
	occupant={data.occupant}
	device={selectedDevice}
/>

<DeleteDeviceForm
	bind:open={isDeleteDeviceDialogOpen}
	data={data.deleteMeasuringDeviceForm}
	device={selectedDevice}
/>

<Page>
	<section slot="header">
		<Header2>Occupant</Header2>
		<Header1>{data.occupant.name}</Header1>
	</section>
	<Card.Root>
		<Card.Content class="py-2 px-4">
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head>Created at</Table.Head>
						<Table.Head>Last updated at</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					<Table.Row>
						<Table.Cell>{data.occupant.created.toLocaleString()}</Table.Cell>
						<Table.Cell>{data.occupant.updated.toLocaleString()}</Table.Cell>
					</Table.Row>
				</Table.Body>
			</Table.Root>
		</Card.Content>
	</Card.Root>
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
				<Button on:click={() => (isAddDeviceDialogOpen = true)}>Add device</Button>
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
							<Table.Head class="w-[125px]">Type</Table.Head>
							<Table.Head>Name</Table.Head>
							<Table.Head class="w-[160px]">Created at</Table.Head>
							<Table.Head class="w-[160px]">Last edited at</Table.Head>
							<Table.Head class="w-9"><span class="sr-only">Action</span></Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each data.occupant.measuringDevices as device (device.id)}
							<Table.Row class="cursor-pointer" on:click={openEditDevice(device)}>
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
								<Table.Cell>{device.created.toLocaleString()}</Table.Cell>
								<Table.Cell>{device.updated.toLocaleString()}</Table.Cell>
								<Table.Cell title="Delete this device">
									<Button
										type="submit"
										variant="destructive"
										size="icon"
										on:click={openDeleteDevice(device)}
									>
										<TrashIcon class="w-4 h-4" />
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
