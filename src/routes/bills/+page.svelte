<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Table from '$lib/components/ui/table';
	import Header1 from '$lib/components/ui/typography/header1.svelte';
	import { currencyFmt, dateFmt } from '$lib/i18n/stores';

	export let data;
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
								{@const totalCosts = data.totalCosts.get(billingPeriod.id)}
								<Table.Row>
									<Table.Cell class="font-medium">
										{$dateFmt.format(billingPeriod.startDate)}
									</Table.Cell>
									<Table.Cell class="font-medium">
										{$dateFmt.format(billingPeriod.endDate)}
									</Table.Cell>
									<Table.Cell>
										{#if totalCosts !== undefined}
											{$currencyFmt.format(totalCosts.electricity)}
										{/if}
									</Table.Cell>
									<Table.Cell>
										{#if totalCosts !== undefined}
											{$currencyFmt.format(totalCosts.heating)}
										{/if}
									</Table.Cell>
									<Table.Cell>
										{#if totalCosts !== undefined}
											{$currencyFmt.format(totalCosts.water)}
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
