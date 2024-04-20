<script lang="ts">
	import EnergyTypeIcon from '$lib/components/icons/energy-type.svelte';
	import * as Accordion from '$lib/components/ui/accordion';
	import * as Card from '$lib/components/ui/card';
	import * as Table from '$lib/components/ui/table';
	import Header1 from '$lib/components/ui/typography/header1.svelte';
	import Header2 from '$lib/components/ui/typography/header2.svelte';
	import { currencyFmt, dateFmt, numberFmt } from '$lib/i18n/stores';
	import { labelsByEnergyType, unitsByEnergyType } from '$lib/models/common';
	import { Person as PersonIcon } from 'svelte-radix';

	export let data;

	const sumAllBills = (occupant: (typeof data.occupantsWithBills)[number]): number => {
		return occupant.energyBills.reduce((acc, bill) => acc + bill.totalCost, 0);
	};
</script>

<!-- FIXME: make this a part of the layout or create a page component -->
<div class="bg-stone-50 flex justify-center items-stretch">
	<main
		class="bg-stone-50 flex min-h-[calc(100vh_-_theme(spacing.16))] flex-1 flex-col gap-4 p-4 md:gap-8 md:p-10 lg:max-w-5xl"
	>
		<Header2>Billing period</Header2>
		<Header1>
			{$dateFmt.format(data.billingPeriod.startDate)}
			-
			{$dateFmt.format(data.billingPeriod.endDate)}
		</Header1>
		<Card.Root>
			<Card.Header>
				<Card.Title>Total cost and consumption</Card.Title>
				<Card.Description
					>Cost and consumption for all energy types for the entire building.</Card.Description
				>
			</Card.Header>
			<Card.Content>
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>Energy type</Table.Head>
							<Table.Head>Consumption</Table.Head>
							<Table.Head>Cost</Table.Head>
							<Table.Head>Fixed cost</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#if data.electricityBill}
							<Table.Row>
								<Table.Cell class="font-medium">
									<div class="flex items-center gap-1">
										<EnergyTypeIcon class="w-4 h-4" energyType="electricity" />
										<span>{labelsByEnergyType['electricity']}</span>
									</div>
								</Table.Cell>
								<Table.Cell>
									{#if data.electricityBill.totalConsumption !== null}
										{$numberFmt.format(data.electricityBill.totalConsumption)}
										{unitsByEnergyType['electricity']}
									{/if}
								</Table.Cell>
								<Table.Cell>
									{$currencyFmt.format(data.electricityBill.totalCost)}
								</Table.Cell>
								<Table.Cell />
							</Table.Row>
						{/if}
						{#if data.waterBill}
							<Table.Row>
								<Table.Cell class="font-medium">
									<div class="flex items-center gap-1">
										<EnergyTypeIcon class="w-4 h-4" energyType="water" />
										<span>{labelsByEnergyType['water']}</span>
									</div>
								</Table.Cell>
								<Table.Cell>
									{#if data.waterBill.totalConsumption !== null}
										{$numberFmt.format(data.waterBill.totalConsumption)}
										{unitsByEnergyType['water']}
									{/if}
								</Table.Cell>
								<Table.Cell>
									{$currencyFmt.format(data.waterBill.totalCost)}
								</Table.Cell>
								<Table.Cell />
							</Table.Row>
						{/if}
						{#if data.heatingBill}
							<Table.Row>
								<Table.Cell class="font-medium">
									<div class="flex items-center gap-1">
										<EnergyTypeIcon class="w-4 h-4" energyType="heating" />
										<span>{labelsByEnergyType['heating']}</span>
									</div>
								</Table.Cell>
								<Table.Cell>
									{#if data.heatingBill.totalConsumption !== null}
										{$numberFmt.format(data.heatingBill.totalConsumption)}
										{unitsByEnergyType['heating']}
									{/if}
								</Table.Cell>
								<Table.Cell>
									{$currencyFmt.format(data.heatingBill.totalCost)}
								</Table.Cell>
								<Table.Cell>
									{#if data.heatingBill.fixedCost !== null}
										{$currencyFmt.format(data.heatingBill.fixedCost)}
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
				<Card.Title class="flex items-center gap-1">Occupants</Card.Title>
				<Card.Description>All occupants participanting in this billing period.</Card.Description>
			</Card.Header>
			<Card.Content>
				{#each data.occupantsWithBills as occupant (occupant.id)}
					<!-- Sum up all the bills -->
					{@const totalCost = sumAllBills(occupant)}
					<Accordion.Root>
						<Accordion.Item value={occupant.id}>
							<Accordion.Trigger class="flex">
								<div class="flex items-center gap-1">
									<PersonIcon class="w-4 h-6 text-muted-foreground" />
									{occupant.name}
								</div>
								<div class="ml-auto pr-4">{$currencyFmt.format(totalCost)}</div>
							</Accordion.Trigger>
							<Accordion.Content>
								<Table.Root>
									<Table.Header>
										<Table.Row>
											<Table.Head>Energy type</Table.Head>
											<Table.Head>Consumption</Table.Head>
											<Table.Head>Cost</Table.Head>
											<Table.Head>Fixed cost</Table.Head>
										</Table.Row>
									</Table.Header>
									<Table.Body>
										{#each occupant.energyBills as bill (bill.id)}
											<Table.Row>
												<Table.Cell>
													<div class="flex items-center gap-1">
														<EnergyTypeIcon class="w-4 h-4" energyType={bill.energyType} />
														<span>{labelsByEnergyType[bill.energyType]}</span>
													</div>
												</Table.Cell>
												<!-- FIXME: get consumption -->
												<Table.Cell>
													{#if bill.totalConsumption !== null}
														{$numberFmt.format(bill.totalConsumption)}
														{unitsByEnergyType[bill.energyType]}
													{/if}
												</Table.Cell>
												<Table.Cell>
													{$currencyFmt.format(bill.totalCost)}
												</Table.Cell>
												<Table.Cell>
													{#if bill.fixedCost !== null && bill.fixedCost > 0}
														{$currencyFmt.format(bill.fixedCost)}
													{/if}
												</Table.Cell>
											</Table.Row>
										{/each}
										<Table.Row class="font-medium">
											<Table.Cell></Table.Cell>
											<Table.Cell />
											<Table.Cell>{$currencyFmt.format(totalCost)}</Table.Cell>
											<!-- FIXME: sum fixed costs? -->
											<Table.Cell />
										</Table.Row>
									</Table.Body>
								</Table.Root>
							</Accordion.Content>
						</Accordion.Item>
					</Accordion.Root>
				{/each}
			</Card.Content>
		</Card.Root>
	</main>
</div>
