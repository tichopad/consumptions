<script lang="ts">
	import DropletsIcon from '$lib/components/icons/droplets.svelte';
	import EnergyTypeIcon from '$lib/components/icons/energy-type.svelte';
	import FlameIcon from '$lib/components/icons/flame.svelte';
	import LightbulbIcon from '$lib/components/icons/lightbulb.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Form from '$lib/components/ui/form';
	import Input from '$lib/components/ui/input/input.svelte';
	import * as Popover from '$lib/components/ui/popover';
	import { RangeCalendar } from '$lib/components/ui/range-calendar';
	import * as Table from '$lib/components/ui/table';
	import Header1 from '$lib/components/ui/typography/header1.svelte';
	import { cn } from '$lib/components/ui/utils';
	import { listFmt } from '$lib/i18n/helpers.js';
	import { labelsByEnergyType, unitsByEnergyType } from '$lib/models/common';
	import type { Occupant } from '$lib/models/occupant';
	import { DateFormatter, getLocalTimeZone, today, type DateValue } from '@internationalized/date';
	import type { DateRange } from 'bits-ui';
	import { Calendar as CalendarIcon, Person as PersonIcon } from 'svelte-radix';
	import { superForm } from 'sveltekit-superforms';

	export let data;

	// FIXME: initial values for total cost and consumption should be undefined/null and marked as required!
	// FIXME: Also make sure that consumptions for each measuring device are required
	const form = superForm(data.form, {
		dataType: 'json',
		onError({ result }) {
			console.log(result.error);
		},
		onUpdated({ form }) {
			console.log(form);
		}
	});

	const { form: formData, enhance } = form;

	const df = new DateFormatter('en-US', {
		dateStyle: 'medium'
	});

	// FIXME: start should be the first day of the current month
	const start = today(getLocalTimeZone());
	// FIXME: end should be the last day of the current month
	const end = start.add({ months: 1 });

	let dateRange: DateRange | undefined = { start, end };
	let startDateValue: DateValue | undefined;

	$: {
		// Set the date range, make sure it's UTC
		if (dateRange?.start) {
			$formData.dateRange.start = dateRange.start.toDate('UTC');
		}
		if (dateRange?.end) {
			$formData.dateRange.end = dateRange.end?.toDate('UTC');
		}
	}

	type OccupantsUnmeasuredInfo = Pick<
		Occupant,
		'chargedUnmeasuredElectricity' | 'chargedUnmeasuredHeating' | 'chargedUnmeasuredWater'
	>;
	const isChargedForUnmeasuredEnergy = (occupant: OccupantsUnmeasuredInfo): boolean => {
		return (
			occupant.chargedUnmeasuredElectricity ||
			occupant.chargedUnmeasuredHeating ||
			occupant.chargedUnmeasuredWater
		);
	};

	const formattedListOfUnmeasuredEnergyTypes = (occupant: OccupantsUnmeasuredInfo): string => {
		const energyTypes: string[] = [];
		if (occupant.chargedUnmeasuredElectricity) energyTypes.push('electricity');
		if (occupant.chargedUnmeasuredHeating) energyTypes.push('heating');
		if (occupant.chargedUnmeasuredWater) energyTypes.push('water');
		return listFmt(energyTypes);
	};
</script>

<main
	class="bg-stone-50 flex min-h-[calc(100vh_-_theme(spacing.16))] flex-1 flex-col gap-4 p-4 md:gap-8 md:p-10"
>
	<Header1>Create new bill</Header1>
	<div>
		<form method="post" action="?/createBill" use:enhance class="flex flex-col gap-2">
			<h2 class="text-xl py-2 font-medium">Basic</h2>
			<div class="grid lg:grid-cols-2 gap-4">
				<!-- Bill info -->
				<fieldset class="rounded-lg border p-4">
					<!-- Date range -->
					<legend class="px-1 text-sm font-medium"> Bill info </legend>
					<Form.Field {form} name="dateRange" class="flex flex-col">
						<Form.Control let:attrs>
							<Form.Label>Date range</Form.Label>
							<Popover.Root openFocus>
								<Popover.Trigger asChild let:builder>
									<Button
										builders={[builder]}
										class={cn(
											'w-[300px] justify-start text-left font-normal',
											!dateRange && 'text-muted-foreground'
										)}
										variant="outline"
									>
										<CalendarIcon class="mr-2 h-4 w-4" />
										{#if dateRange && dateRange.start}
											{#if dateRange.end}
												{df.format(dateRange.start.toDate(getLocalTimeZone()))} - {df.format(
													dateRange.end.toDate(getLocalTimeZone())
												)}
											{:else}
												{df.format(dateRange.start.toDate(getLocalTimeZone()))}
											{/if}
										{:else if startDateValue}
											{df.format(startDateValue.toDate(getLocalTimeZone()))}
										{:else}
											Pick a date
										{/if}
									</Button>
								</Popover.Trigger>
								<Popover.Content class="w-auto p-0" align="start">
									<RangeCalendar
										bind:startValue={startDateValue}
										bind:value={dateRange}
										class="rounded-md border shadow"
										initialFocus
										weekStartsOn={1}
									/>
								</Popover.Content>
							</Popover.Root>
							<Form.Description>The time frame this bill applies to</Form.Description>
							<Form.FieldErrors />
							<input hidden {...attrs} value={$formData.dateRange.start} name="dateRange.start" />
							<input hidden {...attrs} value={$formData.dateRange.end} name="dateRange.end" />
						</Form.Control>
					</Form.Field>
				</fieldset>
				<!-- Energies -->
				<fieldset class="rounded-lg border p-4">
					<legend class="px-1 text-sm font-medium"> Total energy consumption and cost </legend>
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head class="w-[100px]">Energy type</Table.Head>
								<Table.Head class="w-[200px]">Total cost</Table.Head>
								<Table.Head class="w-[200px]">Fixed cost</Table.Head>
								<Table.Head class="w-[100px]">Unit</Table.Head>
								<Table.Head class="w-[200px]">Total consumption</Table.Head>
								<Table.Head class="w-[100px]">Unit</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							<!-- Electricity -->
							<Table.Row>
								<Table.Cell>
									<div class="flex items-center gap-1 font-medium">
										<LightbulbIcon class="w-4 h-4 text-yellow-500" />
										<span>{labelsByEnergyType['electricity']}</span>
									</div>
								</Table.Cell>
								<Table.Cell>
									<Form.Field {form} name="electricityTotalCost">
										<Form.Control let:attrs>
											<Input
												type="number"
												step="0.001"
												placeholder="0.000"
												class="bg-background"
												{...attrs}
												bind:value={$formData.electricityTotalCost}
											/>
										</Form.Control>
									</Form.Field>
								</Table.Cell>
								<Table.Cell><Input type="number" disabled /></Table.Cell>
								<Table.Cell>CZK</Table.Cell>
								<Table.Cell>
									<Form.Field {form} name="electricityTotalConsumption">
										<Form.Control let:attrs>
											<Input
												type="number"
												step="0.001"
												placeholder="0.000"
												class="bg-background"
												{...attrs}
												bind:value={$formData.electricityTotalConsumption}
											/>
										</Form.Control>
									</Form.Field>
								</Table.Cell>
								<Table.Cell>{unitsByEnergyType['electricity']}</Table.Cell>
							</Table.Row>
							<!-- Water -->
							<Table.Row>
								<Table.Cell>
									<div class="flex items-center gap-1 font-medium">
										<DropletsIcon class="w-4 h-4 text-blue-600" />
										<span>{labelsByEnergyType['water']}</span>
									</div>
								</Table.Cell>
								<Table.Cell>
									<Form.Field {form} name="waterTotalCost">
										<Form.Control let:attrs>
											<Input
												type="number"
												step="0.001"
												placeholder="0.000"
												class="bg-background"
												{...attrs}
												bind:value={$formData.waterTotalCost}
											/>
										</Form.Control>
									</Form.Field>
								</Table.Cell>
								<Table.Cell><Input type="number" disabled /></Table.Cell>
								<Table.Cell>CZK</Table.Cell>
								<Table.Cell>
									<Form.Field {form} name="waterTotalConsumption">
										<Form.Control let:attrs>
											<Input
												type="number"
												step="0.001"
												placeholder="0.000"
												class="bg-background"
												{...attrs}
												bind:value={$formData.waterTotalConsumption}
											/>
										</Form.Control>
									</Form.Field>
								</Table.Cell>
								<Table.Cell>{unitsByEnergyType['water']}</Table.Cell>
							</Table.Row>
							<!-- Heating -->
							<Table.Row>
								<Table.Cell>
									<div class="flex items-center gap-1 font-medium">
										<FlameIcon class="w-4 h-4 text-red-600" />
										<span>{labelsByEnergyType['heating']}</span>
									</div>
								</Table.Cell>
								<Table.Cell>
									<Form.Field {form} name="heatingTotalCost">
										<Form.Control let:attrs>
											<Input
												type="number"
												step="0.001"
												placeholder="0.000"
												class="bg-background"
												{...attrs}
												bind:value={$formData.heatingTotalCost}
											/>
										</Form.Control>
									</Form.Field>
								</Table.Cell>
								<Table.Cell>
									<Form.Field {form} name="heatingTotalFixedCost">
										<Form.Control let:attrs>
											<Input
												type="number"
												step="0.001"
												placeholder="0.000"
												class="bg-background"
												{...attrs}
												bind:value={$formData.heatingTotalFixedCost}
											/>
										</Form.Control>
									</Form.Field>
								</Table.Cell>
								<Table.Cell>CZK</Table.Cell>
								<Table.Cell>
									<Form.Field {form} name="heatingTotalConsumption">
										<Form.Control let:attrs>
											<Input
												type="number"
												step="0.001"
												placeholder="0.000"
												class="bg-background"
												{...attrs}
												bind:value={$formData.heatingTotalConsumption}
											/>
										</Form.Control>
									</Form.Field>
								</Table.Cell>
								<Table.Cell>{unitsByEnergyType['heating']}</Table.Cell>
							</Table.Row>
						</Table.Body>
					</Table.Root>
				</fieldset>
			</div>

			<!-- Occupants -->
			<Form.Fieldset {form} class="grid lg:grid-cols-2 gap-4" name="occupants">
				<Form.Legend class="text-xl py-2 font-medium">Occupants</Form.Legend>
				<!-- New occupants -->
				{#each $formData.occupants as occupant, i (occupant.id)}
					<Card.Root>
						<Card.Header>
							<Card.Title class="flex items-center gap-1">
								<PersonIcon class="w-4 h-6 text-muted-foreground" />
								<span>{occupant.name}</span>
							</Card.Title>
							<Card.Description>
								<div class="grid gap-2 pt-2">
									<div class="font-semibold">Occupant Information</div>
									<dl class="grid gap-2">
										<div class="flex items-center justify-between">
											<dt class="text-muted-foreground">Area</dt>
											<dd>{occupant.squareMeters} m²</dd>
										</div>
										<div class="flex items-center justify-between">
											{#if isChargedForUnmeasuredEnergy(occupant)}
												<dt class="text-muted-foreground">
													Is charged for {formattedListOfUnmeasuredEnergyTypes(occupant)} based on area.
												</dt>
											{:else}
												<dt class="text-muted-foreground">
													Is not charged for any unmeasured consumption.
												</dt>
											{/if}
										</div>
										{#if occupant.heatingFixedCostShare}
											<div class="flex items-center justify-between">
												<dt class="text-muted-foreground">
													Participates in fixed heating costs with a share
												</dt>
												<dd>{occupant.heatingFixedCostShare.toFixed(1)}</dd>
											</div>
										{/if}
									</dl>
								</div>
							</Card.Description>
						</Card.Header>
						<Card.Content>
							<!-- Measuring devices -->
							{#if occupant.measuringDevices.length > 0}
								<Form.Fieldset {form} name="occupants[{i}].measuringDevices">
									<Form.Legend class="text-sm font-medium">Measuring devices</Form.Legend>
									<Table.Root>
										<Table.Header>
											<Table.Row>
												<Table.Head class="w-[100px]">Energy type</Table.Head>
												<Table.Head>Name</Table.Head>
												<Table.Head class="w-[200px]">Consumption</Table.Head>
												<Table.Head class="w-[100px]">Unit</Table.Head>
											</Table.Row>
										</Table.Header>
										<Table.Body>
											{#each occupant.measuringDevices as device, j (device.id)}
												<Table.Row>
													<Table.Cell class="font-medium">
														<div class="flex items-center gap-1">
															<EnergyTypeIcon
																class="w-4 h-4"
																energyType={device.energyType}
																withTooltip={false}
															/>
															<span>{labelsByEnergyType[device.energyType]}</span>
														</div>
													</Table.Cell>
													<Table.Cell>{device.name}</Table.Cell>
													<Table.Cell>
														<input type="hidden" bind:value={device.id} />
														<Form.ElementField
															{form}
															name="occupants[{i}].measuringDevices[{j}].consumption"
														>
															<Form.Control let:attrs>
																<Input
																	type="number"
																	step="0.001"
																	placeholder="0.000"
																	{...attrs}
																	bind:value={device.consumption}
																/>
															</Form.Control>
														</Form.ElementField>
													</Table.Cell>
													<Table.Cell>{unitsByEnergyType[device.energyType]}</Table.Cell>
												</Table.Row>
											{/each}
										</Table.Body>
									</Table.Root>
								</Form.Fieldset>
							{/if}
						</Card.Content>
					</Card.Root>
				{/each}
			</Form.Fieldset>
			<Form.Button class="sm:max-w-20">Save</Form.Button>
		</form>
	</div>
</main>
