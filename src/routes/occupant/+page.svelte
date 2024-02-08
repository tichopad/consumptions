<script lang="ts">
	export let data;
</script>

<main class="flex items-center justify-center h-screen">
	<div class="flex flex-col gap-2">
    <a href="/" class="hover:underline">Home</a>
		<h1 class="text-2xl">Occupants List</h1>
    <div>
      <a href="/occupant/create" class="hover:underline">New Occupant</a>
    </div>

		{#if data.occupants.length === 0}
			<p>No occupants found.</p>
		{:else}
			<ul>
				{#each data.occupants as occupant}
					<li><a href={`/occupant/${occupant.id}`}>{occupant.name}</a></li>
				{/each}
			</ul>
		{/if}
	</div>
</main>
