<script lang="ts">
	export let data;
</script>

{#if !data?.occupant}
	<main class="container mx-auto">
		<p>Not found</p>
	</main>
{:else}
	<main class="container mx-auto flex flex-col justify-center items-center">
		<a href="/occupant" class="hover:underline">Back to Occupants</a>
		<h1 class="text-2xl font-bold mb-4">{data.occupant.name}</h1>
		<p class="mb-2">Area: {data.occupant.squareMeters}</p>
		<p class="mb-2">Fixed cost share for heating: {data.occupant.heatingFixedCostShare}</p>
		<p class="mb-2">Charged unmeasured share:</p>
		<ul>
			<li>Electricity: {data.occupant.chargedUnmeasuredElectricity ? 'Yes' : 'No'}</li>
			<li>Water: {data.occupant.chargedUnmeasuredWater ? 'Yes' : 'No'}</li>
			<li>Heating: {data.occupant.chargedUnmeasuredHeating ? 'Yes' : 'No'}</li>
		</ul>
	</main>
{/if}
