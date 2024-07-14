<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Tabs from '$lib/components/ui/tabs';
	import Header1 from '$lib/components/ui/typography/header1.svelte';
	import Page from '$lib/components/ui/typography/page.svelte';
	import type { Occupant } from '$lib/models/occupant';
	import ArchiveOccupantForm from './archive-occupant-form.svelte';
	import CreateForm from './create-form.svelte';
	import DeleteOccupantForm from './delete-occupant-form.svelte';
	import OccupantsList from './occupants-list.svelte';

	export let data;

	// Controls whether the create dialog is open
	let createDialogOpen = false;
	// Controls whether the archive dialog is open
	let archiveDialogOpen = false;
	// Controls whether the delete dialog is open
	let deleteDialogOpen = false;
	// The selected occupant for the archive and delete dialogs
	let selectedOccupant: Occupant | null = null;

	// Opens the archive occupant dialog
	const openArchiveOccupant = (occupant: Occupant) => {
		selectedOccupant = occupant;
		archiveDialogOpen = true;
	};
	// Opens the delete occupant dialog
	const openDeleteOccupant = (occupant: Occupant) => {
		selectedOccupant = occupant;
		deleteDialogOpen = true;
	};
</script>

<!-- Occupant creation form -->
<CreateForm data={data.createForm} bind:open={createDialogOpen} />

<!-- Occupant archival form -->
<ArchiveOccupantForm
	data={data.archiveForm}
	occupant={selectedOccupant}
	bind:open={archiveDialogOpen}
/>

<!-- Occupant deletion form -->
<DeleteOccupantForm
	data={data.deleteForm}
	occupant={selectedOccupant}
	bind:open={deleteDialogOpen}
/>

<Page>
	<section slot="header">
		<div class="flex justify-between items-center">
			<Header1>Subjekty</Header1>
			<Button on:click={() => (createDialogOpen = true)}>Přidat</Button>
		</div>
	</section>
	<Tabs.Root value="unarchived">
		<Tabs.List>
			<Tabs.Trigger value="unarchived">Aktivní</Tabs.Trigger>
			<Tabs.Trigger value="archived">Archivované</Tabs.Trigger>
		</Tabs.List>

		<Tabs.Content value="unarchived">
			<Card.Root>
				<Card.Content class="pt-6">
					<OccupantsList
						emptyMessage="Zatím nejsou žádné subjekty k dispozici. Stiskněte na tlačítko Přidat pro přidání prvního."
						occupants={data.unarchivedOccupants}
						actions={[
							{
								label: 'Archivovat',
								title: 'Archivovat subjekt',
								onClick: openArchiveOccupant
							}
						]}
					/>
				</Card.Content>
			</Card.Root>
		</Tabs.Content>
		<Tabs.Content value="archived">
			<Card.Root>
				<Card.Content class="pt-6">
					<OccupantsList
						emptyMessage="Zatím nebyly žádné subjekty archivovány."
						occupants={data.archivedOccupants}
						actions={[
							{
								label: 'Odstranit',
								title: 'Odstranit subjekt',
								onClick: openDeleteOccupant
							}
						]}
					/>
				</Card.Content>
			</Card.Root>
		</Tabs.Content>
	</Tabs.Root>
</Page>
