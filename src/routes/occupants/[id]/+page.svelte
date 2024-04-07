<script lang="ts">
	import { pushState } from '$app/navigation';
	import { page } from '$app/stores';
	import { Button } from '$lib/components/ui/button';
	import * as Table from '$lib/components/ui/table';
	import AddMeasuringDeviceFormDialog from './add-device-dialog.svelte';
	import Header1 from '$lib/components/ui/typography/header1.svelte';
	import Header2 from '$lib/components/ui/typography/header2.svelte';
	import * as Card from '$lib/components/ui/card';
	import EnergyTypeIcon from '$lib/components/icons/energy-type.svelte';
	import { labelsByEnergyType } from '$lib/models/common';
	import { DotsHorizontal as DotsHorizontalIcon } from 'svelte-radix';

	export let data;
</script>

<div class="bg-stone-50 flex justify-center items-stretch">
	<main
		class="bg-stone-50 flex min-h-[calc(100vh_-_theme(spacing.16))] flex-1 flex-col gap-4 p-4 md:gap-8 md:p-10 lg:max-w-5xl"
	>
		<Header2>Occupant</Header2>
		<Header1>{data.occupant.name}</Header1>
		<Card.Root>
			<Card.Header>
				<Card.Title class="flex justify-between items-center -my-2">
					<span>Measuring devices</span>
					<Button on:click={() => pushState('', { showModal: true })}>Create</Button>
				</Card.Title>
				<Card.Description>List of all the occupant's measuring devices</Card.Description>
			</Card.Header>
			<Card.Content>
				{#if data.occupant.measuringDevices.length === 0}
					<p class="text-sm text-muted-foreground">
						This occupant has no devices yet. Click Create to add a new one.
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
	</main>
</div>

{#if $page.state.showModal}
	<AddMeasuringDeviceFormDialog data={data.form} occupantId={data.occupant.id} />
{/if}
