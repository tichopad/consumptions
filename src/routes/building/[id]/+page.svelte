<script lang="ts">
  export let data;
</script>

{#if !data?.building}
  <main class="container mx-auto">
    <p>Not found</p>
  </main>
{:else}
<main class="container mx-auto flex flex-col justify-center items-center">
  <a href="/building" class="hover:underline">Back to Buildings</a>
  <h1 class="text-2xl font-bold mb-4">{ data.building.name }</h1>
  <p class="mb-2">Area: { data.building.squareMeters }</p>

  <h2 class="text-lg font-bold mt-4 mb-2">Occupants:</h2>
  <ul>
    {#each data.building.occupants as occupant}
      <li class="mb-2">
        <span class="font-bold">{ occupant.name }</span>
      </li>
    {/each}
  </ul>

  <h2 class="text-lg font-bold mt-4 mb-2">Energy Bills:</h2>
  <ul>
    {#each data.building.energyBills as bill}
      <li class="mb-2">
        <span class="font-bold">{ bill.energyType }, { bill.startDate.toISOString() }</span>
      </li>
    {/each}
  </ul>
</main>
{/if}