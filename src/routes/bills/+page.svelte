<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Table from '$lib/components/ui/table';
	import Header1 from '$lib/components/ui/typography/header1.svelte';
	import { currencyFmt, dateFmt } from '$lib/i18n/stores';
	import type { EnergyType } from '$lib/models/common.js';

	export let data;

	// FIXME: there's a better way to get this server-side
	type LoadedBillingPeriod = (typeof data)['allBillingPeriods'][number];
	const getTotalCost = (
		billingPeriod: LoadedBillingPeriod,
		energyType: EnergyType
	): number | null => {
		for (const bill of billingPeriod.energyBills) {
			if (bill.buildingId !== null && bill.energyType === energyType) {
				return bill.totalCost;
			}
		}
		return null;
	};
</script>

<div class="bg-stone-50 flex justify-center items-stretch">
	<main
		class="bg-stone-50 flex min-h-[calc(100vh_-_theme(spacing.16))] flex-1 flex-col gap-4 p-4 md:gap-8 md:p-10 lg:max-w-5xl"
	>
		<div class="flex justify-between items-center">
			<Header1>Bills</Header1><Button href="/bills/create">Create</Button>
		</div>
		<Card.Root>
			<Card.Content class="pt-6">
				{#if data.allBillingPeriods.length === 0}
					<p class="text-muted-foreground">
						No bills yet. Press <i>Create</i> to add the first one.
					</p>
				{:else}
					<Table.Root>
						<!-- Header -->
						<Table.Header>
							<Table.Row>
								<Table.Head class="w-[200px]">From</Table.Head>
								<Table.Head class="w-[200px]">To</Table.Head>
								<Table.Head>Total electricity cost</Table.Head>
								<Table.Head>Total heating cost</Table.Head>
								<Table.Head>Total water cost</Table.Head>
							</Table.Row>
						</Table.Header>

						<!-- Body -->
						<Table.Body>
							{#each data.allBillingPeriods as billingPeriod (billingPeriod.id)}
								<Table.Row
									class="cursor-pointer"
									on:click={() => goto(`/bills/${billingPeriod.id}`)}
								>
									<Table.Cell class="font-medium">
										{$dateFmt.format(billingPeriod.startDate)}
									</Table.Cell>
									<Table.Cell class="font-medium">
										{$dateFmt.format(billingPeriod.endDate)}
									</Table.Cell>
									<Table.Cell>
										{@const totalElectricity = getTotalCost(billingPeriod, 'electricity')}
										{#if totalElectricity !== null}
											{$currencyFmt.format(totalElectricity)}
										{/if}
									</Table.Cell>
									<Table.Cell>
										{@const totalWater = getTotalCost(billingPeriod, 'water')}
										{#if totalWater !== null}
											{$currencyFmt.format(totalWater)}
										{/if}
									</Table.Cell>
									<Table.Cell>
										{@const totalHeating = getTotalCost(billingPeriod, 'heating')}
										{#if totalHeating !== null}
											{$currencyFmt.format(totalHeating)}
										{/if}
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
