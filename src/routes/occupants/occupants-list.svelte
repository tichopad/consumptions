<script lang="ts">
	import { goto } from '$app/navigation';
	import EnergyTypeIcon from '$lib/components/icons/energy-type.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as Table from '$lib/components/ui/table';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { dateFmt, numberFmt } from '$lib/i18n/helpers';
	import type { Occupant } from '$lib/models/occupant';
	import { isChargedForAnyUnmeasuredEnergy } from '$lib/occupants/utils';
	import {
		DotsHorizontal as DotsHorizontalIcon,
		QuestionMarkCircled as QuestionMarkCircledIcon
	} from 'svelte-radix';

	/** Occupants to display */
	export let occupants: Occupant[];

	type Action = {
		/** Label to display */
		label: string;
		/** Tooltip title */
		title: string;
		/** Callback to execute when the action is clicked */
		onClick: (occupant: Occupant) => void;
	};
	/** Actions to display in the last column */
	export let actions: Action[];
</script>

<Table.Root>
	<Table.Header>
		<Table.Row>
			<Table.Head class="lg:w-1/4">Název</Table.Head>
			<Table.Head>Výměra</Table.Head>
			<Table.Head>Energie účtované dle výměry</Table.Head>
			<Table.Head class="flex gap-1 items-center">
				<span>Podíl na fixním nákladu</span>
				<Tooltip.Root openDelay={500}>
					<Tooltip.Trigger>
						<QuestionMarkCircledIcon class="w-4 h-4" />
					</Tooltip.Trigger>
					<Tooltip.Content>
						Definuje, jestli a jak moc přispívá subjekt k opakovanému fixnímu nákladu. Opakovaný
						fixní náklad se týká pouze tepelné energie.
					</Tooltip.Content>
				</Tooltip.Root>
			</Table.Head>
			<Table.Head class="w-[100px]">Přidán</Table.Head>
			<Table.Head class="w-9"><span class="sr-only">Akce</span></Table.Head>
		</Table.Row>
	</Table.Header>
	<Table.Body>
		{#each occupants as occupant (occupant.id)}
			<!-- FIXME: should be a proper link  -->
			<Table.Row class="cursor-pointer" on:click={() => goto(`/occupants/${occupant.id}`)}>
				<Table.Cell class="font-medium">
					<span class:text-muted-foreground={occupant.isArchived}>
						{occupant.name}
					</span>
				</Table.Cell>
				<Table.Cell>
					{numberFmt(occupant.squareMeters)}&nbsp;m²
				</Table.Cell>
				<Table.Cell>
					<div class="flex gap-1">
						{#if occupant.chargedUnmeasuredElectricity}
							<EnergyTypeIcon class="w-4 h-4" energyType="electricity" />
						{/if}
						{#if occupant.chargedUnmeasuredHeating}
							<EnergyTypeIcon class="w-4 h-4" energyType="heating" />
						{/if}
						{#if occupant.chargedUnmeasuredWater}
							<EnergyTypeIcon class="w-4 h-4" energyType="water" />
						{/if}
						{#if !isChargedForAnyUnmeasuredEnergy(occupant)}
							<span class="text-muted-foreground">-</span>
						{/if}
					</div>
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
				<Table.Cell>
					<DropdownMenu.Root>
						<DropdownMenu.Trigger asChild let:builder>
							<Button
								aria-haspopup="true"
								size="icon"
								variant="ghost"
								builders={[builder]}
								on:click={(event) => event.stopPropagation()}
							>
								<DotsHorizontalIcon class="h-4 w-4" />
								<span class="sr-only">Otevřít nebo zavřít menu</span>
							</Button>
						</DropdownMenu.Trigger>
						<DropdownMenu.Content align="end">
							<DropdownMenu.Label class="sr-only">Akce</DropdownMenu.Label>
							{#each actions as action}
								<DropdownMenu.Item
									class="hover:cursor-pointer"
									title={action.title}
									on:click={() => action.onClick(occupant)}
								>
									{action.label}
								</DropdownMenu.Item>
							{/each}
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				</Table.Cell>
			</Table.Row>
		{/each}
	</Table.Body>
</Table.Root>
