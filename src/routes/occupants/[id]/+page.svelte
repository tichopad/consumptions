<script lang="ts">
	import { goto } from '$app/navigation';
	import EnergyTypeIcon from '$lib/components/icons/energy-type.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import DateMetadata from '$lib/components/ui/date-metadata.svelte';
	import * as Table from '$lib/components/ui/table';
	import Header1 from '$lib/components/ui/typography/header1.svelte';
	import Header2 from '$lib/components/ui/typography/header2.svelte';
	import Page from '$lib/components/ui/typography/page.svelte';
	import { currencyFmt, dateFmt, energyUnitFmt, rangeDateFmt } from '$lib/i18n/helpers';
	import { labelsByEnergyType, type EnergyType } from '$lib/models/common';
	import type { EnergyBill } from '$lib/models/energy-bill';
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

	// Get a specific energy bill from a list of bills
	const getBill = (bills: EnergyBill[], energyType: EnergyType) => {
		return bills.find((bill) => bill.energyType === energyType);
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
		<Header2>Subjekt</Header2>
		<Header1>{data.occupant.name}</Header1>
	</section>
	<DateMetadata
		archived={data.occupant.archived}
		created={data.occupant.created}
		updated={data.occupant.updated}
	/>
	<Card.Root>
		<Card.Header>
			<Card.Title>Základní informace</Card.Title>
		</Card.Header>
		<Card.Content>
			<EditForm data={data.editOccupantForm} />
		</Card.Content>
	</Card.Root>
	<Card.Root>
		<Card.Header>
			<Card.Title class="flex justify-between items-center -my-2">
				<span>Měřící zařízení</span>
				<Button on:click={() => (isAddDeviceDialogOpen = true)}>Přidat zařízení</Button>
			</Card.Title>
			<Card.Description>Seznam všech aktivních měřících zařízení subjektu</Card.Description>
		</Card.Header>
		<Card.Content>
			{#if data.occupant.measuringDevices.length === 0}
				<p class="text-sm text-muted-foreground">
					Tento subjekt zatím nemá žádné měřící zařízení. Klikněte na tlačítko Přidat zařízení pro
					vytvoření nového.
				</p>
			{:else}
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head class="w-[125px]">Typ energie</Table.Head>
							<Table.Head>Name</Table.Head>
							<Table.Head class="w-[160px]">Vytvořeno</Table.Head>
							<Table.Head class="w-[160px]">Poslední úprava</Table.Head>
							<Table.Head class="w-9"><span class="sr-only">Akce</span></Table.Head>
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
								<Table.Cell>
									{dateFmt(device.created, { dateStyle: 'medium', timeStyle: 'short' })}
								</Table.Cell>
								<Table.Cell>
									{dateFmt(device.updated, { dateStyle: 'medium', timeStyle: 'short' })}
								</Table.Cell>
								<Table.Cell title="Odstranit toto zařízení">
									<Button
										type="button"
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
	<Card.Root>
		<Card.Header>
			<Card.Title>Vyúčtování</Card.Title>
			<Card.Description>Seznam vyúčtování subjektu</Card.Description>
		</Card.Header>
		<Card.Content>
			{#if data.billingPeriodsWithBills.length === 0}
				<p class="text-sm text-muted-foreground">
					Tento subjekt zatím nemá žádné vyúčtování. Stiskněte na tlačítko Přidat pro přidání
					prvního.
				</p>
			{:else}
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head class="w-[300px]">Datum</Table.Head>
							<Table.Head>
								<div class="flex items-center gap-1">
									<EnergyTypeIcon class="w-4 h-4" energyType="electricity" withTooltip={false} />
									<span>{labelsByEnergyType['electricity']}</span>
								</div>
							</Table.Head>
							<Table.Head>
								<div class="flex items-center gap-1">
									<EnergyTypeIcon class="w-4 h-4" energyType="water" withTooltip={false} />
									<span>{labelsByEnergyType['water']}</span>
								</div>
							</Table.Head>
							<Table.Head>
								<div class="flex items-center gap-1">
									<EnergyTypeIcon class="w-4 h-4" energyType="heating" withTooltip={false} />
									<span>{labelsByEnergyType['heating']}</span>
								</div>
							</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each data.billingPeriodsWithBills as billingPeriod (billingPeriod.id)}
							<Table.Row class="cursor-pointer" on:click={() => goto(`/bills/${billingPeriod.id}`)}>
								<Table.Cell class="font-medium">
									{rangeDateFmt({ start: billingPeriod.startDate, end: billingPeriod.endDate })}
								</Table.Cell>
								{@const electricityBill = getBill(billingPeriod.energyBills, 'electricity')}
								{@const waterBill = getBill(billingPeriod.energyBills, 'water')}
								{@const heatingBill = getBill(billingPeriod.energyBills, 'heating')}
								<Table.Cell>
									{#if electricityBill !== undefined}
										<div class="flex flex-col justify-center items-start gap-1">
											<div class="font-medium">{currencyFmt(electricityBill.totalCost)}</div>
											{#if electricityBill.totalConsumption !== null}
												<div>
													{energyUnitFmt(electricityBill.totalConsumption, 'electricity')}
												</div>
											{/if}
										</div>
									{/if}
								</Table.Cell>
								<Table.Cell>
									{#if waterBill !== undefined}
										<div class="flex flex-col justify-center items-start gap-1">
											<div class="font-medium">{currencyFmt(waterBill.totalCost)}</div>
											{#if waterBill.totalConsumption !== null}
												<div>
													{energyUnitFmt(waterBill.totalConsumption, 'water')}
												</div>
											{/if}
										</div>
									{/if}
								</Table.Cell>
								<Table.Cell>
									{#if heatingBill !== undefined}
										<div class="flex flex-col justify-center items-start gap-1">
											<div class="font-medium">
												{currencyFmt(heatingBill.totalCost)}
												{#if heatingBill.fixedCost !== null}
													<span class="font-normal text-muted-foreground">
														(z toho {currencyFmt(heatingBill.fixedCost ?? 0)} fix.)
													</span>
												{/if}
											</div>
											{#if heatingBill.totalConsumption !== null}
												<div>
													{energyUnitFmt(heatingBill.totalConsumption, 'heating')}
												</div>
											{/if}
										</div>
									{/if}
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			{/if}
		</Card.Content>
	</Card.Root>
</Page>
