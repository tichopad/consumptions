<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Table from '$lib/components/ui/table';
	import Header1 from '$lib/components/ui/typography/header1.svelte';
	import { currencyFmt, dateFmt } from '$lib/i18n/helpers';
	import type { EnergyType } from '$lib/models/common';

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
			<Header1>Vyúčtování</Header1><Button href="/bills/create">Vytvořit</Button>
		</div>
		<Card.Root>
			<Card.Content class="pt-6">
				{#if data.allBillingPeriods.length === 0}
					<p class="text-muted-foreground">
						Zatím nebyly vytvořeny žádná vyúčtování. Stiskněte na tlačítko <i>Vytvořit</i> pro přidání
						prvního.
					</p>
				{:else}
					<Table.Root>
						<!-- Header -->
						<Table.Header>
							<Table.Row>
								<Table.Head class="w-[200px]">Od</Table.Head>
								<Table.Head class="w-[200px]">Do</Table.Head>
								<Table.Head>Celkem za elektřinu</Table.Head>
								<Table.Head>Celkem za teplo</Table.Head>
								<Table.Head>Celkem za vodu</Table.Head>
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
										{dateFmt(billingPeriod.startDate, { dateStyle: 'long', timeStyle: undefined })}
									</Table.Cell>
									<Table.Cell class="font-medium">
										{dateFmt(billingPeriod.endDate, { dateStyle: 'long', timeStyle: undefined })}
									</Table.Cell>
									<Table.Cell>
										{@const totalElectricity = getTotalCost(billingPeriod, 'electricity')}
										{#if totalElectricity !== null}
											{currencyFmt(totalElectricity)}
										{/if}
									</Table.Cell>
									<Table.Cell>
										{@const totalWater = getTotalCost(billingPeriod, 'water')}
										{#if totalWater !== null}
											{currencyFmt(totalWater)}
										{/if}
									</Table.Cell>
									<Table.Cell>
										{@const totalHeating = getTotalCost(billingPeriod, 'heating')}
										{#if totalHeating !== null}
											{currencyFmt(totalHeating)}
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
