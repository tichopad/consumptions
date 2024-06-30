<script lang="ts">
	import EnergyTypeIcon from '$lib/components/icons/energy-type.svelte';
	import * as Accordion from '$lib/components/ui/accordion';
	import * as Card from '$lib/components/ui/card';
	import DateMetadata from '$lib/components/ui/date-metadata.svelte';
	import * as Table from '$lib/components/ui/table';
	import Header1 from '$lib/components/ui/typography/header1.svelte';
	import Header2 from '$lib/components/ui/typography/header2.svelte';
	import Page from '$lib/components/ui/typography/page.svelte';
	import { currencyFmt, dateFmt, numberFmt } from '$lib/i18n/helpers';
	import { labelsByEnergyType, unitsByEnergyType } from '$lib/models/common';
	import { Person as PersonIcon } from 'svelte-radix';

	export let data;

	type OccupantItem = (typeof data.occupantsWithBills)[number];

	// Sum up all the bills for a given occupant
	const sumAllBills = (occupant: OccupantItem): number => {
		return occupant.energyBills.reduce((acc, bill) => acc + bill.totalCost, 0);
	};
	const hasMeasuredBills = (occupant: OccupantItem): boolean => {
		return occupant.energyBills.some((bill) => bill.totalConsumption !== null);
	};
	const hasUnmeasuredBills = (occupant: OccupantItem): boolean => {
		return occupant.energyBills.some((bill) => bill.totalConsumption === null);
	};
</script>

<Page>
	<section slot="header">
		<Header2>Billing period</Header2>
		<Header1>
			{dateFmt(data.billingPeriod.startDate)}
			-
			{dateFmt(data.billingPeriod.endDate)}
		</Header1>
	</section>
	<!-- FIXME: showing updated timestamp for non-updateable entities doesn't make sense -->
	<DateMetadata created={data.billingPeriod.created} />
	{#if data.building !== null}
		<Card.Root>
			<Card.Header>
				<Card.Title><h3>Building</h3></Card.Title>
				<Card.Description>Basic information about the building.</Card.Description>
			</Card.Header>
			<Card.Content>
				<Table.Root>
					<Table.Body>
						<Table.Row>
							<Table.Head class="w-[200px]">Total occupied area</Table.Head>
							<Table.Cell>
								{numberFmt(data.occupiedArea)}&nbsp;m²
							</Table.Cell>
						</Table.Row>
						<Table.Row>
							<Table.Head>Occupants</Table.Head>
							<Table.Cell>
								{numberFmt(data.occupantsWithBills.length)}
							</Table.Cell>
						</Table.Row>
					</Table.Body>
				</Table.Root>
			</Card.Content>
		</Card.Root>
	{/if}
	<Card.Root>
		<Card.Header>
			<Card.Title><h3>Total cost and consumption</h3></Card.Title>
			<Card.Description>
				Cost and consumption for all energy types for the entire building.
			</Card.Description>
		</Card.Header>
		<Card.Content>
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head>Energy type</Table.Head>
						<Table.Head>Consumption</Table.Head>
						<Table.Head>Unit cost</Table.Head>
						<Table.Head>Cost per area</Table.Head>
						<Table.Head>Total cost</Table.Head>
						<Table.Head>Fixed cost</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#if data.electricityBill}
						<Table.Row>
							<Table.Cell class="font-medium">
								<div class="flex items-center gap-1">
									<EnergyTypeIcon class="w-4 h-4" energyType="electricity" withTooltip={false} />
									<span>{labelsByEnergyType['electricity']}</span>
								</div>
							</Table.Cell>
							<Table.Cell>
								{#if data.electricityBill.totalConsumption !== null}
									{numberFmt(data.electricityBill.totalConsumption)}
									{unitsByEnergyType['electricity']}
								{/if}
							</Table.Cell>
							<Table.Cell>
								{#if data.electricityBill.costPerUnit !== null}
									{currencyFmt(data.electricityBill.costPerUnit)}
									/
									{unitsByEnergyType[data.electricityBill.energyType]}
								{/if}
							</Table.Cell>
							<Table.Cell>
								{#if data.electricityBill.costPerSquareMeter !== null}
									{currencyFmt(data.electricityBill.costPerSquareMeter)} / m²
								{:else}
									-
								{/if}
							</Table.Cell>
							<Table.Cell>
								{currencyFmt(data.electricityBill.totalCost)}
							</Table.Cell>
							<Table.Cell>-</Table.Cell>
						</Table.Row>
					{/if}
					{#if data.waterBill}
						<Table.Row>
							<Table.Cell class="font-medium">
								<div class="flex items-center gap-1">
									<EnergyTypeIcon class="w-4 h-4" energyType="water" withTooltip={false} />
									<span>{labelsByEnergyType['water']}</span>
								</div>
							</Table.Cell>
							<Table.Cell>
								{#if data.waterBill.totalConsumption !== null}
									{numberFmt(data.waterBill.totalConsumption)}
									{unitsByEnergyType['water']}
								{/if}
							</Table.Cell>
							<Table.Cell>
								{#if data.waterBill.costPerUnit !== null}
									{currencyFmt(data.waterBill.costPerUnit)}
									/
									{unitsByEnergyType[data.waterBill.energyType]}
								{/if}
							</Table.Cell>
							<Table.Cell>
								{#if data.waterBill.costPerSquareMeter !== null}
									{currencyFmt(data.waterBill.costPerSquareMeter)} / m²
								{:else}
									-
								{/if}
							</Table.Cell>
							<Table.Cell>
								{currencyFmt(data.waterBill.totalCost)}
							</Table.Cell>
							<Table.Cell>-</Table.Cell>
						</Table.Row>
					{/if}
					{#if data.heatingBill}
						<Table.Row>
							<Table.Cell class="font-medium">
								<div class="flex items-center gap-1">
									<EnergyTypeIcon class="w-4 h-4" energyType="heating" withTooltip={false} />
									<span>{labelsByEnergyType['heating']}</span>
								</div>
							</Table.Cell>
							<Table.Cell>
								{#if data.heatingBill.totalConsumption !== null}
									{numberFmt(data.heatingBill.totalConsumption)}
									{unitsByEnergyType['heating']}
								{/if}
							</Table.Cell>
							<Table.Cell>
								{#if data.heatingBill.costPerUnit !== null}
									{currencyFmt(data.heatingBill.costPerUnit)}
									/
									{unitsByEnergyType[data.heatingBill.energyType]}
								{/if}
							</Table.Cell>
							<Table.Cell>
								{#if data.heatingBill.costPerSquareMeter !== null}
									{currencyFmt(data.heatingBill.costPerSquareMeter)} / m²
								{:else}
									-
								{/if}
							</Table.Cell>
							<Table.Cell>
								{currencyFmt(data.heatingBill.totalCost)}
							</Table.Cell>
							<Table.Cell>
								{#if data.heatingBill.fixedCost !== null}
									{currencyFmt(data.heatingBill.fixedCost)}
								{/if}
							</Table.Cell>
						</Table.Row>
					{/if}
				</Table.Body>
			</Table.Root>
		</Card.Content>
	</Card.Root>
	<Card.Root>
		<Card.Header>
			<Card.Title class="flex items-center gap-1"><h3>Occupants</h3></Card.Title>
			<Card.Description>All occupants participanting in this billing period.</Card.Description>
		</Card.Header>
		<Card.Content>
			{#if data.occupantsWithBills.length > 0}
				{#each data.occupantsWithBills as occupant (occupant.id)}
					<!-- Sum up all the bills -->
					{@const totalCost = sumAllBills(occupant)}
					<Accordion.Root multiple>
						<Accordion.Item value={occupant.id}>
							<Accordion.Trigger class="flex">
								<div class="flex items-center gap-2">
									<PersonIcon class="w-4 h-4 text-muted-foreground" />
									{occupant.name}
								</div>
								<div class="ml-auto pr-4">{currencyFmt(totalCost)}</div>
							</Accordion.Trigger>
							<Accordion.Content>
								<div class="flex flex-col gap-3">
									<Card.Root>
										<Card.Header>
											<Card.Title><h4>About</h4></Card.Title>
											<Card.Description>
												Detailed information about {occupant.name}
											</Card.Description>
										</Card.Header>
										<Card.Content>
											<Table.Root>
												<Table.Body>
													<Table.Row>
														<Table.Head class="w-[200px]">Area</Table.Head>
														<Table.Cell>
															{numberFmt(occupant.squareMeters)}&nbsp;m²
														</Table.Cell>
													</Table.Row>
													{#if occupant.heatingFixedCostShare !== null}
														<Table.Row>
															<Table.Head>Heating fixed cost share</Table.Head>
															<Table.Cell>
																{numberFmt(occupant.heatingFixedCostShare)}
															</Table.Cell>
														</Table.Row>
													{/if}
													<Table.Row>
														<Table.Head>Total cost</Table.Head>
														<Table.Cell>
															{currencyFmt(totalCost)}
														</Table.Cell>
													</Table.Row>
												</Table.Body>
											</Table.Root>
										</Card.Content>
									</Card.Root>
									{#if hasUnmeasuredBills(occupant)}
										<Card.Root>
											<Card.Header>
												<Card.Title><h4>Charged based on area</h4></Card.Title>
											</Card.Header>
											<Card.Content>
												<Table.Root>
													<Table.Header>
														<Table.Row>
															<Table.Head>Energy type</Table.Head>
															<Table.Head>Cost per area</Table.Head>
															<Table.Head>Total cost</Table.Head>
														</Table.Row>
													</Table.Header>
													<Table.Body>
														{#each occupant.energyBills as bill (bill.id)}
															{#if bill.totalConsumption === null}
																<Table.Row>
																	<Table.Cell>
																		<div class="flex items-center gap-1">
																			<EnergyTypeIcon
																				class="w-4 h-4"
																				energyType={bill.energyType}
																				withTooltip={false}
																			/>
																			<span>{labelsByEnergyType[bill.energyType]}</span>
																		</div>
																	</Table.Cell>
																	<Table.Cell>
																		{#if bill.costPerSquareMeter !== null}
																			{currencyFmt(bill.costPerSquareMeter)} / m²
																		{:else}
																			-
																		{/if}
																	</Table.Cell>
																	<Table.Cell>
																		{currencyFmt(bill.totalCost)}
																	</Table.Cell>
																</Table.Row>
															{/if}
														{/each}
													</Table.Body>
												</Table.Root>
											</Card.Content>
										</Card.Root>
									{/if}
									<!-- Measured -->
									{#if hasMeasuredBills(occupant)}
										<Card.Root>
											<Card.Header>
												<Card.Title><h4>Measured</h4></Card.Title>
											</Card.Header>
											<Card.Content>
												<Table.Root>
													<Table.Header>
														<Table.Row>
															<Table.Head>Energy type</Table.Head>
															<Table.Head>Consumption</Table.Head>
															<Table.Head>Unit cost</Table.Head>
															<Table.Head>Total cost</Table.Head>
															<Table.Head>Fixed cost</Table.Head>
														</Table.Row>
													</Table.Header>
													<Table.Body>
														{#each occupant.energyBills as bill (bill.id)}
															{#if bill.totalConsumption !== null}
																<Table.Row>
																	<Table.Cell>
																		<div class="flex items-center gap-1">
																			<EnergyTypeIcon
																				class="w-4 h-4"
																				energyType={bill.energyType}
																				withTooltip={false}
																			/>
																			<span>{labelsByEnergyType[bill.energyType]}</span>
																		</div>
																	</Table.Cell>
																	<Table.Cell>
																		{numberFmt(bill.totalConsumption)}
																		{unitsByEnergyType[bill.energyType]}
																	</Table.Cell>
																	<Table.Cell>
																		{#if bill.costPerUnit !== null}
																			{currencyFmt(bill.costPerUnit)}
																			/
																			{unitsByEnergyType[bill.energyType]}
																		{:else}
																			-
																		{/if}
																	</Table.Cell>
																	<Table.Cell>
																		{currencyFmt(bill.totalCost)}
																	</Table.Cell>
																	<Table.Cell>
																		{#if bill.fixedCost !== null}
																			{currencyFmt(bill.fixedCost)}
																		{:else}
																			-
																		{/if}
																	</Table.Cell>
																</Table.Row>
															{/if}
														{/each}
													</Table.Body>
												</Table.Root>
											</Card.Content>
										</Card.Root>
									{/if}
								</div>
							</Accordion.Content>
						</Accordion.Item>
					</Accordion.Root>
				{/each}
			{:else}
				<p class="text-sm text-muted-foreground">
					There were no occupants participating in this billing period.
				</p>
			{/if}
		</Card.Content>
	</Card.Root></Page
>
