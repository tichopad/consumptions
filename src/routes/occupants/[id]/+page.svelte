<script lang="ts">
	import { pushState } from '$app/navigation';
	import { page } from '$app/stores';
	import EnergyTypeIcon from '$lib/components/icons/energy-type.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import * as Form from '$lib/components/ui/form';
	import Input from '$lib/components/ui/input/input.svelte';
	import * as Table from '$lib/components/ui/table';
	import Header1 from '$lib/components/ui/typography/header1.svelte';
	import Header2 from '$lib/components/ui/typography/header2.svelte';
	import Page from '$lib/components/ui/typography/page.svelte';
	import { labelsByEnergyType } from '$lib/models/common';
	import { DotsHorizontal as DotsHorizontalIcon } from 'svelte-radix';
	import { toast } from 'svelte-sonner';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { superForm } from 'sveltekit-superforms/client';
	import { createOccupantFormSchema } from '../create-edit-form-schema';
	import AddMeasuringDeviceFormDialog from './add-device-dialog.svelte';

	export let data;

	const form = superForm(data.editOccupantForm, {
		validators: zodClient(createOccupantFormSchema),
		// Required in order for the loader data to take precedence over the returned form data
		invalidateAll: 'force',
		onUpdated(event) {
			if (event.form.valid) {
				toast.success(event.form.message ?? 'Occupant updated.');
			} else {
				toast.error(`Failed to update ${data.occupant.name}.`);
			}
		}
	});

	const { form: formData, enhance, delayed, isTainted, tainted } = form;
</script>

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
			<form method="post" action="?/editOccupant" use:enhance>
				<div class="flex flex-col">
					<!-- Name -->
					<Form.Field {form} name="name">
						<Form.Control let:attrs>
							<Form.Label>Name</Form.Label>
							<Input {...attrs} bind:value={$formData.name} />
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>
					<div class="flex gap-2 flex-col sm:flex-row">
						<!-- Area -->
						<Form.Field {form} name="squareMeters" class="flex-1">
							<Form.Control let:attrs>
								<Form.Label>Area (m²)</Form.Label>
								<Input {...attrs} type="number" step="0.001" bind:value={$formData.squareMeters} />
							</Form.Control>
							<Form.Description>The area that's currently in use by the occupant.</Form.Description>
							<Form.FieldErrors />
						</Form.Field>
						<!-- Fixed heating cost share -->
						<Form.Field {form} name="heatingFixedCostShare" class="flex-1">
							<Form.Control let:attrs>
								<Form.Label>Fixed heating cost share</Form.Label>
								<Input
									{...attrs}
									type="number"
									step="0.001"
									bind:value={$formData.heatingFixedCostShare}
								/>
							</Form.Control>
							<Form.Description>
								Defines if and how much does the occupant contribute to the recurring fixed heating
								cost.
							</Form.Description>
							<Form.FieldErrors />
						</Form.Field>
					</div>
				</div>
				<fieldset class="py-2">
					<div class="pb-4">
						<legend class="font-medium leading-none text-base py-2"
							>Consumption charged by area</legend
						>
						<p class="text-[0.8rem] text-muted-foreground">
							Select which energy consumption is charged based on occupant's area.
						</p>
					</div>
					<div class="py-2">
						<!-- Electricity -->
						<Form.Field {form} name="chargedUnmeasuredElectricity">
							<div class="flex flex-row items-start space-x-3">
								<Form.Control let:attrs>
									<Checkbox {...attrs} bind:checked={$formData.chargedUnmeasuredElectricity} />
									<Form.Label class="flex gap-1 items-center font-normal">
										<EnergyTypeIcon class="w-4 h-4" energyType="electricity" withTooltip={false} />
										{labelsByEnergyType['electricity']}
									</Form.Label>
									<input name={attrs.name} value={$formData.chargedUnmeasuredElectricity} hidden />
								</Form.Control>
							</div>
							<Form.FieldErrors />
						</Form.Field>
						<!-- Heating -->
						<Form.Field {form} name="chargedUnmeasuredHeating">
							<div class="flex flex-row items-start space-x-3">
								<Form.Control let:attrs>
									<Checkbox {...attrs} bind:checked={$formData.chargedUnmeasuredHeating} />
									<Form.Label class="flex gap-1 items-center font-normal">
										<EnergyTypeIcon class="w-4 h-4" energyType="heating" withTooltip={false} />
										{labelsByEnergyType['heating']}
									</Form.Label>
									<input name={attrs.name} value={$formData.chargedUnmeasuredHeating} hidden />
								</Form.Control>
							</div>
							<Form.FieldErrors />
						</Form.Field>
						<!-- Water -->
						<Form.Field {form} name="chargedUnmeasuredWater">
							<div class="flex flex-row items-start space-x-3">
								<Form.Control let:attrs>
									<Checkbox {...attrs} bind:checked={$formData.chargedUnmeasuredWater} />
									<Form.Label class="flex gap-1 items-center font-normal">
										<EnergyTypeIcon class="w-4 h-4" energyType="water" withTooltip={false} />
										{labelsByEnergyType['water']}
									</Form.Label>
									<input name={attrs.name} value={$formData.chargedUnmeasuredWater} hidden />
								</Form.Control>
							</div>
							<Form.FieldErrors />
						</Form.Field>
					</div>
				</fieldset>
				<Form.Button disabled={$delayed || !isTainted($tainted)} class="mt-1">
					{$delayed ? 'Saving ...' : 'Save'}
				</Form.Button>
			</form>
		</Card.Content>
	</Card.Root>
	<Card.Root>
		<Card.Header>
			<Card.Title class="flex justify-between items-center -my-2">
				<span>Measuring devices</span>
				<Button on:click={() => pushState('', { showModal: true })}>Add device</Button>
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

{#if $page.state.showModal}
	<AddMeasuringDeviceFormDialog
		data={data.insertMeasuringDeviceForm}
		occupantId={data.occupant.id}
	/>
{/if}
