<main class="flex items-center justify-center">
	<form class="max-w-md mx-auto" method="post">
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
		<div class="flex items-center justify-center">
			<button
				type="submit"
				class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
				>Create Building</button
			>
		</div>
	</form>
</main>
