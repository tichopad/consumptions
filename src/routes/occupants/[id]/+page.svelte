<script lang="ts">
	export let data;

	import { energyTypes } from '$lib/helpers';
</script>

<main
	class="flex min-h-[calc(100vh_-_theme(spacing.16))] flex-1 flex-col gap-4 p-4 md:gap-8 md:p-10"
>
	<div>
		<p class="text-sm text-gray-500 dark:text-gray-400">Occupant</p>
		<h1 class="text-2xl font-bold py-2">{data.occupant.name}</h1>
		<p class="text-gray-500 dark:text-gray-400">69 m²</p>
	</div>
</main>

<h1 class="text-2xl font-bold mb-4">{data.occupant.name}</h1>
<p class="mb-2">Area: {data.occupant.squareMeters}</p>
<p class="mb-2">
	Fixed cost share for heating: {data.occupant.heatingFixedCostShare ?? 'None'}
</p>
<p class="mb-2">Charged unmeasured share:</p>
<ul>
	<li>Electricity: {data.occupant.chargedUnmeasuredElectricity ? 'Yes' : 'No'}</li>
	<li>Water: {data.occupant.chargedUnmeasuredWater ? 'Yes' : 'No'}</li>
	<li>Heating: {data.occupant.chargedUnmeasuredHeating ? 'Yes' : 'No'}</li>
</ul>

<section class="mt-8">
	<h2 class="text-xl font-bold mb-4">Measuring Devices</h2>
	{#each data.occupant.measuringDevices as device (device.id)}
		<div class="bg-gray-100 p-4 rounded-lg shadow-md mb-4">
			<p class="text-lg font-semibold">Name: {device.name}</p>
			<p class="text-gray-500">Type: {device.energyType}</p>
			<div class="flex justify-end mt-2">
				<button
					class="px-4 py-2 bg-blue-500 text-white rounded-md mr-2"
					on:click={() => console.log('Edit ' + device.id)}>Edit</button
				>
				<button
					class="px-4 py-2 bg-red-500 text-white rounded-md"
					on:click={() => console.log('Delete' + device.id)}>Delete</button
				>
			</div>
		</div>
	{/each}
</section>

<section class="mt-8">
	<h2 class="text-xl font-bold mb-4">Add New Measuring Device</h2>
	<form class="flex flex-col items-start">
		<label for="name" class="text-lg font-semibold">Name:</label>
		<input
			type="text"
			id="name"
			name="name"
			class="border border-gray-300 rounded-md px-2 py-1 w-64"
		/>

		<label for="type" class="text-lg font-semibold mt-4">Type:</label>
		<select id="type" name="type" class="border border-gray-300 rounded-md px-2 py-1 w-64">
			{#each energyTypes as type}
				<option value={type}>{type}</option>
			{/each}
		</select>

		<button type="submit" class="px-4 py-2 bg-green-500 text-white rounded-md mt-4"
			>Add Device</button
		>
	</form>
</section>
