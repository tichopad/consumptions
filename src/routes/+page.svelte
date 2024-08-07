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
	import PieChart from './pie-chart.svelte';

	export let data;
</script>

<Page>
	<section slot="header">
		<Header2>Přehled</Header2>
		<Header1>Poslední vyúčtování</Header1>
	</section>
	<section class="flex flex-col gap-4">
		<div class="flex flex-row items-center justify-between">
			{#if !isNullable(data.latestBilling)}
				<Header3>
					{dateFmt(data.latestBilling.startDate, { dateStyle: 'long', timeStyle: undefined })}
					-
					{dateFmt(data.latestBilling.endDate, { dateStyle: 'long', timeStyle: undefined })}
				</Header3>
				{#if !isNullable(data.latestBilling)}
					<Button href="/bills/{data.latestBilling.id}">Přejít na detail</Button>
				{/if}
			{/if}
		</div>
		{#if isNullable(data.latestBilling)}
			<p class="text-muted-foreground">Zatím nebylo vytvořeno žádné vyúčtování.</p>
		{:else}
			<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3 pt-6">
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
							{#if data.electricityChartData && data.electricityChartData.length > 0}
								<div class="pt-4">
									<PieChart
										chartData={data.electricityChartData}
										size={data.electricityChartData.length > 6 ? 400 : 300}
									/>
								</div>
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
							{#if data.waterChartData && data.waterChartData.length > 0}
								<div class="pt-4">
									<PieChart
										chartData={data.waterChartData}
										size={data.waterChartData.length > 6 ? 400 : 300}
									/>
								</div>
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
							{#if data.heatingChartData && data.heatingChartData.length > 0}
								<div class="pt-4">
									<PieChart
										chartData={data.heatingChartData}
										size={data.heatingChartData.length > 6 ? 400 : 300}
									/>
								</div>
							{/if}
						</Card.Content>
					</Card.Root>
				{/if}
			</div>
		{/if}
	</section>
</Page>
