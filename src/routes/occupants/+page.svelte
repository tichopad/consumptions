<script lang="ts">
	import { goto } from '$app/navigation';
	import EnergyTypeIcon from '$lib/components/icons/energy-type.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Table from '$lib/components/ui/table';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import Header1 from '$lib/components/ui/typography/header1.svelte';
	import { dateFmt, numberFmt } from '$lib/i18n/helpers';
	import type { Occupant } from '$lib/models/occupant';
	import { QuestionMarkCircled as QuestionMarkCircledIcon } from 'svelte-radix';
	import CreateForm from './create-form.svelte';

	export let data;

	let createDialogOpen = false;

	const isNotChargedForUnmeasuredEnergy = (occupant: Occupant) => {
		return (
			!occupant.chargedUnmeasuredElectricity &&
			!occupant.chargedUnmeasuredHeating &&
			!occupant.chargedUnmeasuredWater
		);
	};
</script>

<!-- Occupant creation form -->
<CreateForm data={data.form} bind:open={createDialogOpen} />

<div class="bg-stone-50 flex justify-center items-stretch">
	<main
		class="bg-stone-50 flex min-h-[calc(100vh_-_theme(spacing.16))] flex-1 flex-col gap-4 p-4 md:gap-8 md:p-10 lg:max-w-5xl"
	>
		<div class="flex justify-between items-center">
			<Header1>Subjekty</Header1>
			<Button on:click={() => (createDialogOpen = true)}>Přidat</Button>
		</div>
		<Card.Root>
			<Card.Content class="pt-6">
				{#if data.occupants.length === 0}
					<p class="text-muted-foreground">
						Žádné subjekty nebyly nalezeny. Klikněte na tlačítko <i>Přidat</i> pro vytvoření prvního.
					</p>
				{:else}
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head class="lg:w-1/3">Název</Table.Head>
								<Table.Head>Výměra</Table.Head>
								<Table.Head>Energie účtované dle výměry</Table.Head>
								<Table.Head class="flex gap-1 items-center">
									<span>Podíl na fixním nákladu</span>
									<Tooltip.Root openDelay={500}>
										<Tooltip.Trigger>
											<QuestionMarkCircledIcon class="w-4 h-4" />
										</Tooltip.Trigger>
										<Tooltip.Content>
											Definuje, jestli a jak moc přispívá subjekt k opakovanému fixnímu nákladu.
											Opakovaný fixní náklad se týká pouze tepelné energie.
										</Tooltip.Content>
									</Tooltip.Root>
								</Table.Head>
								<Table.Head class="w-[100px]">Přidán</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each data.occupants as occupant (occupant.id)}
								<!-- FIXME: should be a proper link  -->
								<Table.Row
									class="cursor-pointer"
									on:click={() => goto(`/occupants/${occupant.id}`)}
								>
									<Table.Cell class="font-medium">
										{occupant.name}
									</Table.Cell>
									<Table.Cell>
										{numberFmt(occupant.squareMeters)}&nbsp;m²
									</Table.Cell>
									<Table.Cell class="flex gap-1">
										{#if occupant.chargedUnmeasuredElectricity}
											<EnergyTypeIcon class="w-4 h-4" energyType="electricity" />
										{/if}
										{#if occupant.chargedUnmeasuredHeating}
											<EnergyTypeIcon class="w-4 h-4" energyType="heating" />
										{/if}
										{#if occupant.chargedUnmeasuredWater}
											<EnergyTypeIcon class="w-4 h-4" energyType="water" />
										{/if}
										{#if isNotChargedForUnmeasuredEnergy(occupant)}
											<span class="text-muted-foreground">-</span>
										{/if}
									</Table.Cell>
									<Table.Cell>
										{#if occupant.heatingFixedCostShare !== null}
											{numberFmt(occupant.heatingFixedCostShare)}
										{:else}
											<span class="text-muted-foreground">-</span>
										{/if}
									</Table.Cell>
									<Table.Cell>
										{dateFmt(occupant.created, { dateStyle: 'medium', timeStyle: undefined })}
									</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				{/if}
			</Card.Content>
		</Card.Root>
	</main>
</div>
