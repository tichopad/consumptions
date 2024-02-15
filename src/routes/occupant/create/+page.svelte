<script lang="ts">
	export let data;
</script>

<main class="flex items-center justify-center">
	<form class="max-w-md mx-auto" method="post">
		<a href="/occupant" class="hover:underline">Back to Occupants</a>
		<div class="mb-4">
			<label for="name" class="block text-gray-700 text-sm font-bold mb-2">Name:</label>
			<input
				type="text"
				id="name"
				name="name"
				class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
				required
			/>
		</div>
		<div class="mb-4">
			<label for="squareMeters" class="block text-gray-700 text-sm font-bold mb-2">Area (m2):</label
			>
			<input
				type="number"
				id="squareMeters"
				name="squareMeters"
				class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
				required
			/>
		</div>
		<div class="mb-4">
			<label for="heatingFixedCostShare" class="block text-gray-700 text-sm font-bold mb-2"
				>Fixed cost share for heating:</label
			>
			<input
				type="number"
				id="heatingFixedCostShare"
				name="heatingFixedCostShare"
				class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
				required
			/>
		</div>
		<div class="mb-4">
			<label for="building" class="block text-gray-700 text-sm font-bold mb-2">Building:</label>
			<select
				id="buildingId"
				name="buildingId"
				class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
				required
			>
				{#each data.buildings as building}
					<option value={building.id}>{building.name}</option>
				{/each}
			</select>
		</div>
		<div class="mb-4">
			<label for="chargedUnmeasuredShare" class="block text-gray-700 text-sm font-bold mb-2"
				>Charged unmeasured share:</label
			>
			<div class="flex items-center">
				<input type="checkbox" id="electricity" name="chargedUnmeasuredElectricity" class="mr-2" />
				<label for="electricity" class="text-gray-700 text-sm font-bold">Electricity</label>
			</div>
			<div class="flex items-center">
				<input type="checkbox" id="water" name="chargedUnmeasuredHeating" class="mr-2" />
				<label for="water" class="text-gray-700 text-sm font-bold">Water</label>
			</div>
			<div class="flex items-center">
				<input type="checkbox" id="heating" name="chargedUnmeasuredWater" class="mr-2" />
				<label for="heating" class="text-gray-700 text-sm font-bold">Heating</label>
			</div>

			<div class="flex items-center justify-center">
				<button
					type="submit"
					class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
					>Create Building</button
				>
			</div>
		</div>
	</form>
</main>
