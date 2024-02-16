<script lang="ts">
	export let data;
</script>

<main class="flex items-center justify-center h-screen">
	<div class="flex flex-col gap-2">
		<a href="/" class="hover:underline">Home</a>
		<h1 class="text-2xl">Building List</h1>
		<div>
			<a href="/buildings/create" class="hover:underline">New Building</a>
		</div>

		{#if data.buildings.length === 0}
			<p>No buildings found.</p>
		{:else}
			<ul>
				{#each data.buildings as building}
					<li><a href={`/buildings/${building.id}`}>{building.name}</a></li>
				{/each}
			</ul>
		{/if}
	</div>
</main>
