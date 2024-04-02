<script lang="ts">
	import EnergyTypeIcon from '$lib/components/icons/energy-type.svelte';
	import * as Accordion from '$lib/components/ui/accordion';
	import * as Card from '$lib/components/ui/card';
	import * as Table from '$lib/components/ui/table';
	import { labelsByEnergyType, unitsByEnergyType } from '$lib/models/common';
	import { Person as PersonIcon } from 'radix-icons-svelte';

	export let data;

	const electricityBill = data.buildingWithBills?.energyBills.find(
		(bill) => bill.energyType === 'electricity'
	);
	const heatingBill = data.buildingWithBills?.energyBills.find(
		(bill) => bill.energyType === 'heating'
	);
	const waterBill = data.buildingWithBills?.energyBills.find((bill) => bill.energyType === 'water');

	const sumAllBills = (occupant: (typeof data.occupantsWithBills)[number]): number => {
		return occupant.energyBills.reduce((acc, bill) => acc + bill.totalCost, 0);
	};

	const locale = 'en-US';
	const dateFormatter = new Intl.DateTimeFormat(locale, { dateStyle: 'long' });
	const numberFormatter = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });
	const currencyFormatter = new Intl.NumberFormat(locale, {
		currency: 'CZK',
		maximumFractionDigits: 2,
		style: 'currency'
	});
</script>

<!-- FIXME: make this a part of the layout or create a page component -->
<main
	class="bg-stone-50 flex min-h-[calc(100vh_-_theme(spacing.16))] flex-1 flex-col gap-4 p-4 md:gap-8 md:p-10"
>
	<h1 class="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">Billing period</h1>
	<h2
		class="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0"
	>
		From
		{dateFormatter.format(data.billingPeriod.startDate)}
		-
		{dateFormatter.format(data.billingPeriod.endDate)}
	</h2>
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
					{#if electricityBill}
						<Table.Row>
							<Table.Cell class="font-medium">
								<div class="flex items-center gap-1">
									<EnergyTypeIcon class="w-4 h-4" energyType="electricity" />
									<span>{labelsByEnergyType['electricity']}</span>
								</div>
							</Table.Cell>
							<Table.Cell>
								{numberFormatter.format(42069)}
								{unitsByEnergyType['electricity']}
							</Table.Cell>
							<Table.Cell>
								{currencyFormatter.format(electricityBill.totalCost)}
							</Table.Cell>
							<Table.Cell />
						</Table.Row>
					{/if}
					{#if waterBill}
						<Table.Row>
							<Table.Cell class="font-medium">
								<div class="flex items-center gap-1">
									<EnergyTypeIcon class="w-4 h-4" energyType="water" />
									<span>{labelsByEnergyType['water']}</span>
								</div>
							</Table.Cell>
							<Table.Cell>
								{numberFormatter.format(42069)}
								{unitsByEnergyType['water']}
							</Table.Cell>
							<Table.Cell>
								{currencyFormatter.format(waterBill.totalCost)}
							</Table.Cell>
							<Table.Cell />
						</Table.Row>
					{/if}
					{#if heatingBill}
						<Table.Row>
							<Table.Cell class="font-medium">
								<div class="flex items-center gap-1">
									<EnergyTypeIcon class="w-4 h-4" energyType="heating" />
									<span>{labelsByEnergyType['heating']}</span>
								</div>
							</Table.Cell>
							<Table.Cell>
								{numberFormatter.format(42069)}
								{unitsByEnergyType['heating']}
							</Table.Cell>
							<Table.Cell>
								{currencyFormatter.format(heatingBill.totalCost)}
							</Table.Cell>
							<Table.Cell>
								{#if heatingBill.fixedCost !== null}
									{currencyFormatter.format(heatingBill.fixedCost)}
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
				<Accordion.Root>
					<Accordion.Item value={occupant.id}>
						<Accordion.Trigger class="flex">
							<div class="flex items-center gap-1">
								<PersonIcon class="w-4 h-6 text-muted-foreground" />
								{occupant.name}
							</div>
							<div class="ml-auto pr-4">{currencyFormatter.format(sumAllBills(occupant))}</div>
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
											<Table.Cell>{numberFormatter.format(69420)}</Table.Cell>
											<Table.Cell>
												{currencyFormatter.format(bill.totalCost)}
											</Table.Cell>
											<Table.Cell>
												{#if bill.fixedCost !== null && bill.fixedCost > 0}
													{currencyFormatter.format(bill.fixedCost)}
												{/if}
											</Table.Cell>
										</Table.Row>
									{/each}
									<Table.Row class="font-medium bg-muted">
										<Table.Cell>Sum</Table.Cell>
										<Table.Cell />
										<Table.Cell>{currencyFormatter.format(sumAllBills(occupant))}</Table.Cell>
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
