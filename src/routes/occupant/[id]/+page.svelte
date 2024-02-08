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
    <p class="mb-2">Magical constant: {data.occupant.magicalConstant}</p>
    <p class="mb-2">Charged unmeasured share:</p>
    <ul>
      <li>Electricity: {data.occupant.chargedUnmeasuredShare.electricity ? 'Yes' : 'No'}</li>
      <li>Water: {data.occupant.chargedUnmeasuredShare.water ? 'Yes' : 'No'}</li>
      <li>Heating: {data.occupant.chargedUnmeasuredShare.heating ? 'Yes' : 'No'}</li>
    </ul>
	</main>
{/if}
