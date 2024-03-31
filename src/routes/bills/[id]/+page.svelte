<script lang="ts">
	export let data;

	const electricityBill = data.buildingWithBills?.energyBills.find(
		(bill) => bill.energyType === 'electricity'
	);
	const heatingBill = data.buildingWithBills?.energyBills.find(
		(bill) => bill.energyType === 'heating'
	);
	const waterBill = data.buildingWithBills?.energyBills.find((bill) => bill.energyType === 'water');
</script>

<main
	class="flex min-h-[calc(100vh_-_theme(spacing.16))] flex-1 flex-col gap-4 p-4 md:gap-8 md:p-10"
>
	<div>
		<h1 class="text-2xl font-bold py-2">Bills</h1>
	</div>
	<div>
		<h2 class="text-2xl">Bill</h2>
		<div class="flex flex-col gap-4">
			<div class="flex flex-col gap-2">
				<span class="font-bold">Start Date:</span>
				<span>{data.billingPeriod.startDate.toLocaleDateString()}</span>
			</div>
			<div class="flex flex-col gap-2">
				<span class="font-bold">End Date:</span>
				<span>{data.billingPeriod.endDate.toLocaleDateString()}</span>
			</div>
			{#if electricityBill}
				<div class="flex flex-col gap-2">
					<span class="font-bold">Total electricity cost</span>
					<span>{electricityBill.totalCost}</span>
				</div>
			{/if}
			{#if heatingBill}
				<div class="flex flex-col gap-2">
					<span class="font-bold">Total heating cost</span>
					<span>{heatingBill.totalCost}</span>
				</div>
				<div class="flex flex-col gap-2">
					<span class="font-bold">Total fixed cost</span>
					<span>{heatingBill.fixedCost}</span>
				</div>
			{/if}
			{#if waterBill}
				<div class="flex flex-col gap-2">
					<span class="font-bold">Total water cost</span>
					<span>{waterBill.totalCost}</span>
				</div>
			{/if}
		</div>
		{#each data.occupantsWithBills as occupant (occupant.id)}
			<div class="flex flex-col gap-2">
				<span class="font-bold">Name:</span>
				<span class="font-bold">{occupant.name}</span>
				{#each occupant.energyBills as bill (bill.id)}
					<div class="px-4">
						<div class="flex flex-col gap-2">
							<span class="font-bold">Type:</span>
							<span>{bill.energyType}</span>
						</div>
						<div class="flex flex-col gap-2">
							<span class="font-bold">Cost:</span>
							<span>{bill.totalCost}</span>
						</div>
					</div>
				{/each}
			</div>
		{/each}
	</div>
</main>
