<script lang="ts">
	import EnergyTypeIcon from '$lib/components/icons/energy-type.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Card from '$lib/components/ui/card';
	import Header1 from '$lib/components/ui/typography/header1.svelte';
	import Header2 from '$lib/components/ui/typography/header2.svelte';
	import Header3 from '$lib/components/ui/typography/header3.svelte';
	import Page from '$lib/components/ui/typography/page.svelte';
	import { currencyFmt, dateFmt, numberFmt } from '$lib/i18n/helpers';
	import { unitsByEnergyType } from '$lib/models/common';
	import { isNullable } from '$lib/utils';
	import { Loop as LoopIcon } from 'svelte-radix';

	export let data;
</script>

<Page>
	<section slot="header">
		<Header1>Přehled</Header1>
	</section>
	<section>
		<div class="flex flex-row items-top justify-between space-y-0 pb-2">
			<div>
				<Header2>Poslední vyúčtování</Header2>
				{#if !isNullable(data.latestBilling)}
					<Header3 class="pt-4">
						{dateFmt(data.latestBilling.startDate, { dateStyle: 'long', timeStyle: undefined })}
						-
						{dateFmt(data.latestBilling.endDate, { dateStyle: 'long', timeStyle: undefined })}
					</Header3>
				{/if}
			</div>
			{#if !isNullable(data.latestBilling)}
				<Button href="/bills/{data.latestBilling.id}" class="mt-2">Přejít na detail</Button>
			{/if}
		</div>
		{#if isNullable(data.latestBilling)}
			<p class="text-muted-foreground">Zatím nebylo vytvořeno žádné vyúčtování.</p>
		{:else}
			<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4 pt-6">
				{#if !isNullable(data.latestBuildingElectricityBill)}
					<Card.Root>
						<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
							<Card.Title class="text-sm font-medium">Elektřina</Card.Title>
							<EnergyTypeIcon class="h-4 w-4" energyType="electricity" />
						</Card.Header>
						<Card.Content>
							<div class="text-2xl font-bold">
								{currencyFmt(data.latestBuildingElectricityBill.totalCost)}
							</div>
							{#if !isNullable(data.latestBuildingElectricityBill.totalConsumption)}
								{@const totalConsumption = data.latestBuildingElectricityBill.totalConsumption}
								<p class="text-sm text-muted-foreground">
									{numberFmt(totalConsumption)}&nbsp;{unitsByEnergyType['electricity']}
								</p>
							{/if}
						</Card.Content>
					</Card.Root>
				{/if}
				{#if !isNullable(data.latestBuildingWaterBill)}
					<Card.Root>
						<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
							<Card.Title class="text-sm font-medium">Voda</Card.Title>
							<EnergyTypeIcon class="h-4 w-4" energyType="water" />
						</Card.Header>
						<Card.Content>
							<div class="text-2xl font-bold">
								{currencyFmt(data.latestBuildingWaterBill.totalCost)}
							</div>
							{#if !isNullable(data.latestBuildingWaterBill.totalConsumption)}
								{@const totalConsumption = data.latestBuildingWaterBill.totalConsumption}
								<p class="text-sm text-muted-foreground">
									{numberFmt(totalConsumption)}&nbsp;{unitsByEnergyType['water']}
								</p>
							{/if}
						</Card.Content>
					</Card.Root>
				{/if}
				{#if !isNullable(data.latestBuildingHeatingBill)}
					<Card.Root>
						<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
							<Card.Title class="text-sm font-medium">Teplo</Card.Title>
							<EnergyTypeIcon class="h-4 w-4" energyType="heating" />
						</Card.Header>
						<Card.Content>
							<div class="text-2xl font-bold" title="Celkové náklady na teplo">
								{currencyFmt(data.latestBuildingHeatingBill.totalCost)}
							</div>
							{#if !isNullable(data.latestBuildingHeatingBill.totalConsumption)}
								{@const totalConsumption = data.latestBuildingHeatingBill.totalConsumption}
								<p class="text-sm text-muted-foreground">
									{numberFmt(totalConsumption)}&nbsp;{unitsByEnergyType['heating']}
								</p>
							{/if}
						</Card.Content>
					</Card.Root>
				{/if}
				{#if !isNullable(data.latestBuildingHeatingBill?.fixedCost)}
					<Card.Root>
						<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
							<Card.Title class="text-sm font-medium">Teplo (fixní)</Card.Title>
							<LoopIcon class="h-4 w-4 text-muted-foreground" />
						</Card.Header>
						<Card.Content>
							<div class="text-2xl font-bold" title="Fixní náklady na teplo">
								{currencyFmt(data.latestBuildingHeatingBill.fixedCost)}
							</div>
						</Card.Content>
					</Card.Root>
				{/if}
			</div>
		{/if}
	</section>
</Page>
