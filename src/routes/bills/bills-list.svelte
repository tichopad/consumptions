<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as Table from '$lib/components/ui/table';
	import { currencyFmt, dateFmt } from '$lib/i18n/helpers';
	import type { BillingPeriod } from '$lib/models/billing-period';
	import type { EnergyType } from '$lib/models/common';
	import type { EnergyBill } from '$lib/models/energy-bill';
	import type { ComponentType } from 'svelte';
	import { DotsHorizontal as DotsHorizontalIcon, Icon } from 'svelte-radix';

	type BillingPeriodWithEnergyBills = BillingPeriod & {
		energyBills?: EnergyBill[];
	};

	/** Billing periods to display */
	export let billingPeriods: BillingPeriodWithEnergyBills[] = [];
	/** Message to display when there are no billing periods */
	export let emptyMessage: string | undefined = 'Žádná vyúčtování nebyla nalezena.';

	type Action = {
		/** Label to display */
		label: string;
		/** Tooltip title */
		title: string;
		/** Icon to display */
		icon?: ComponentType;
		/** Callback to execute when the action is clicked */
		onClick: (billingPeriod: BillingPeriod) => void;
	};
	/** Actions to display in the last column */
	export let actions: Action[] | undefined = undefined;

	type ExtraColumn = {
		label: string;
		value: (billingPeriod: BillingPeriod) => string | number | null;
	};
	/** Extra columns to display after the last column */
	export let extraColumns: ExtraColumn[] = [];

	const getTotalCost = (
		billingPeriod: BillingPeriodWithEnergyBills,
		energyType: EnergyType
	): number | null => {
		if (!billingPeriod.energyBills) return null;
		for (const bill of billingPeriod.energyBills) {
			if (bill.buildingId !== null && bill.energyType === energyType) {
				return bill.totalCost;
			}
		}
		return null;
	};
</script>

{#if billingPeriods.length === 0}
	<p class="text-muted-foreground">{emptyMessage}</p>
{:else}
	<Table.Root>
		<Table.Header>
			<Table.Row>
				<Table.Head class="w-[200px]">Od</Table.Head>
				<Table.Head class="w-[200px]">Do</Table.Head>
				<Table.Head>Celkem za elektřinu</Table.Head>
				<Table.Head>Celkem za teplo</Table.Head>
				<Table.Head>Celkem za vodu</Table.Head>
				{#each extraColumns as column}
					<Table.Head class="w-[100px]">{column.label}</Table.Head>
				{/each}
				<Table.Head class="w-9"><span class="sr-only">Akce</span></Table.Head>
			</Table.Row>
		</Table.Header>

		<Table.Body>
			{#each billingPeriods as billingPeriod (billingPeriod.id)}
				<Table.Row class="cursor-pointer" on:click={() => goto(`/bills/${billingPeriod.id}`)}>
					<Table.Cell class="font-medium">
						<span class:text-muted-foreground={billingPeriod.isArchived}>
							{dateFmt(billingPeriod.startDate, { dateStyle: 'long', timeStyle: undefined })}
						</span>
					</Table.Cell>
					<Table.Cell class="font-medium">
						<span class:text-muted-foreground={billingPeriod.isArchived}>
							{dateFmt(billingPeriod.endDate, { dateStyle: 'long', timeStyle: undefined })}
						</span>
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
					{#each extraColumns as column}
						<Table.Cell>{column.value(billingPeriod)}</Table.Cell>
					{/each}
					{#if actions !== undefined}
						<Table.Cell>
							<DropdownMenu.Root>
								<DropdownMenu.Trigger asChild let:builder>
									<Button
										aria-haspopup="true"
										size="icon"
										variant="ghost"
										builders={[builder]}
										on:click={(event) => event.stopPropagation()}
									>
										<DotsHorizontalIcon class="h-4 w-4" />
										<span class="sr-only">Otevřít nebo zavřít menu</span>
									</Button>
								</DropdownMenu.Trigger>
								<DropdownMenu.Content align="end">
									<DropdownMenu.Label class="sr-only">Akce</DropdownMenu.Label>
									{#each actions as action}
										<DropdownMenu.Item
											class="hover:cursor-pointer flex gap-1 items-center"
											title={action.title}
											on:click={() => action.onClick(billingPeriod)}
										>
											{#if action.icon !== undefined}
												<Icon icon={action.icon} />
											{/if}
											{action.label}
										</DropdownMenu.Item>
									{/each}
								</DropdownMenu.Content>
							</DropdownMenu.Root>
						</Table.Cell>
					{/if}
				</Table.Row>
			{/each}
		</Table.Body>
	</Table.Root>
{/if}
